import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireSuperadmin } from "@/lib/superadmin";
import { isMissingPlanFeaturesTableError } from "@/lib/planFeatures";

type PlanPayload = {
  name?: string;
  price?: number;
  interval?: string | null;
  stripe_price_id?: string | null;
  features?: string[] | null;
  is_popular?: boolean | null;
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

  const updates: Record<string, unknown> = {};
  if (typeof body.name === "string") updates.name = body.name.trim();
  if (typeof body.price === "number") updates.price = body.price;
  if ("interval" in body) updates.interval = body.interval ?? null;
  if ("stripe_price_id" in body) updates.stripe_price_id = body.stripe_price_id ?? null;
  if ("is_popular" in body) updates.is_popular = body.is_popular ?? false;

  const hasFeatureUpdate = "features" in body;
  if (Object.keys(updates).length === 0 && !hasFeatureUpdate) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  let data: any = null;
  if (Object.keys(updates).length > 0) {
    const { data: updated, error } = await supabaseAdmin
      .from("plans")
      .update(updates)
      .eq("id", planId)
      .select("*")
      .maybeSingle();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    data = updated;
  } else {
    const { data: current, error } = await supabaseAdmin
      .from("plans")
      .select("*")
      .eq("id", planId)
      .maybeSingle();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    data = current;
  }

  if (!data) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  if ("features" in body) {
    const nextFeatures = (body.features ?? []).filter((feature) => feature.trim().length > 0);
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

  const { error } = await supabaseAdmin.from("plans").delete().eq("id", planId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
