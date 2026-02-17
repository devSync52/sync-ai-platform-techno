import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireSuperadmin } from "@/lib/superadmin";
import {
  isMissingPlanFeaturesTableError,
  isMissingPlanStatusColumnError,
} from "@/lib/planFeatures";
import { syncStripePriceForPlan } from "@/lib/stripePlans";

type PlanPayload = {
  name?: string;
  price?: number;
  interval?: string | null;
  stripe_price_id?: string | null;
  features?: string[] | null;
  is_popular?: boolean | null;
  status?: "active" | "inactive" | null;
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  const auth = await requireSuperadmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { planId } = await params;
  if (!planId) {
    return NextResponse.json({ error: "Missing planId" }, { status: 400 });
  }

  let body: PlanPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { data: existingPlan, error: existingPlanError } = await supabaseAdmin
    .from("plans")
    .select("*")
    .eq("id", planId)
    .maybeSingle();
  if (existingPlanError) {
    return NextResponse.json({ error: existingPlanError.message }, { status: 500 });
  }
  if (!existingPlan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof body.name === "string") {
    const nextName = body.name.trim();
    if (!nextName) {
      return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
    }
    updates.name = nextName;
  }
  if (typeof body.price === "number") {
    if (body.price <= 0) {
      return NextResponse.json({ error: "price must be greater than 0" }, { status: 400 });
    }
    updates.price = body.price;
  }
  if ("interval" in body) updates.interval = body.interval ?? null;
  const requestedStripePriceId =
    "stripe_price_id" in body ? body.stripe_price_id?.trim() || null : undefined;
  if (requestedStripePriceId !== undefined) updates.stripe_price_id = requestedStripePriceId;
  if ("is_popular" in body) updates.is_popular = body.is_popular ?? false;
  if ("status" in body) {
    updates.status = body.status === "inactive" ? "inactive" : "active";
  }

  const hasFeatureUpdate = "features" in body;
  const nextFeatures = hasFeatureUpdate
    ? (body.features ?? []).filter((feature) => feature.trim().length > 0)
    : null;
  if (nextFeatures) {
    updates.features = nextFeatures;
  }
  const hasPlanPricingUpdate =
    "name" in body || "price" in body || "interval" in body;

  const shouldAutoSyncStripe =
    hasPlanPricingUpdate &&
    (requestedStripePriceId === undefined ||
      requestedStripePriceId === null ||
      requestedStripePriceId === existingPlan.stripe_price_id);

  if (shouldAutoSyncStripe) {
    try {
      const stripePriceId = await syncStripePriceForPlan({
        planId,
        name: (updates.name as string) ?? existingPlan.name,
        price: (updates.price as number) ?? existingPlan.price,
        interval: (updates.interval as string | null | undefined) ?? existingPlan.interval,
        existingStripePriceId: existingPlan.stripe_price_id,
      });
      updates.stripe_price_id = stripePriceId;
    } catch (stripeError) {
      return NextResponse.json(
        {
          error:
            stripeError instanceof Error
              ? stripeError.message
              : "Failed to sync plan to Stripe",
        },
        { status: 500 },
      );
    }
  }

  if (Object.keys(updates).length === 0 && !hasFeatureUpdate) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  let data: any = null;
  if (Object.keys(updates).length > 0) {
    let updated: any = null;
    let error: any = null;
    const firstUpdate = await supabaseAdmin
      .from("plans")
      .update(updates)
      .eq("id", planId)
      .select("*")
      .maybeSingle();
    updated = firstUpdate.data;
    error = firstUpdate.error;

    if (error && isMissingPlanStatusColumnError(error) && "status" in updates) {
      const { status: _status, ...updatesWithoutStatus } = updates;
      const fallbackUpdate = await supabaseAdmin
        .from("plans")
        .update(updatesWithoutStatus)
        .eq("id", planId)
        .select("*")
        .maybeSingle();
      updated = fallbackUpdate.data;
      error = fallbackUpdate.error;
    }
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    data = updated;
  } else {
    data = existingPlan;
  }

  if (nextFeatures) {
    const { error: deleteFeaturesError } = await supabaseAdmin
      .from("plan_features")
      .delete()
      .eq("plan_id", planId);
    if (deleteFeaturesError) {
      if (isMissingPlanFeaturesTableError(deleteFeaturesError)) {
        const { error: fallbackError } = await supabaseAdmin
          .from("plans")
          .update({ features: nextFeatures })
          .eq("id", planId);
        if (fallbackError) {
          return NextResponse.json({ error: fallbackError.message }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: deleteFeaturesError.message }, { status: 500 });
      }
    } else if (nextFeatures.length > 0) {
      const { error: insertFeaturesError } = await supabaseAdmin.from("plan_features").insert(
        nextFeatures.map((feature, index) => ({
          plan_id: planId,
          feature: feature.trim(),
          sort_order: index,
        })),
      );
      if (insertFeaturesError) {
        if (isMissingPlanFeaturesTableError(insertFeaturesError)) {
          const { error: fallbackError } = await supabaseAdmin
            .from("plans")
            .update({ features: nextFeatures })
            .eq("id", planId);
          if (fallbackError) {
            return NextResponse.json({ error: fallbackError.message }, { status: 500 });
          }
        } else {
          return NextResponse.json({ error: insertFeaturesError.message }, { status: 500 });
        }
      }
    }
  }

  const { data: features, error: featuresError } = await supabaseAdmin
    .from("plan_features")
    .select("feature")
    .eq("plan_id", planId)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (featuresError) {
    if (isMissingPlanFeaturesTableError(featuresError)) {
      return NextResponse.json({
        success: true,
        plan: {
          ...data,
          status: data.status ?? "active",
          features: data.features ?? [],
        },
      });
    }
    return NextResponse.json({ error: featuresError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    plan: {
      ...data,
      status: data.status ?? "active",
      features: (features ?? []).map((row: any) => row.feature),
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  const auth = await requireSuperadmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { planId } = await params;
  if (!planId) {
    return NextResponse.json({ error: "Missing planId" }, { status: 400 });
  }

  const { count, error: usageError } = await supabaseAdmin
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("plan_id", planId);
  if (usageError) {
    return NextResponse.json({ error: usageError.message }, { status: 500 });
  }

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      {
        error:
          "This plan is assigned to one or more users and cannot be deleted.",
      },
      { status: 409 },
    );
  }

  const { error } = await supabaseAdmin.from("plans").delete().eq("id", planId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
