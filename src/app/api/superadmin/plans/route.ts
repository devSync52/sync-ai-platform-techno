import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireSuperadmin } from "@/lib/superadmin";
import { isMissingFeaturesTableError, isMissingPlanFeatureIdColumnError, isMissingPlanFeaturesTableError, isMissingPlanStatusColumnError, loadPlansWithFeatures, } from "@/lib/planFeatures";
import { syncStripePriceForPlan } from "@/lib/stripePlans";

type PlanPayload = {
  name?: string;
  price?: number;
  interval?: string | null;
  stripe_price_id?: string | null;
  features?: string[] | null;
  feature_ids?: string[] | null;
  is_popular?: boolean | null;
  status?: "active" | "inactive" | null;
};

export async function GET() {
  const auth = await requireSuperadmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const plans = await loadPlansWithFeatures();
    const { data: usersWithPlan, error: usersError } = await supabaseAdmin
      .from("users")
      .select("plan_id")
      .not("plan_id", "is", null);

    if (usersError) {
      throw new Error(usersError.message);
    }

    const usageCount = new Map<string, number>();
    for (const user of usersWithPlan ?? []) {
      const planId = (user as { plan_id: string | null }).plan_id;
      if (!planId) continue;
      usageCount.set(planId, (usageCount.get(planId) ?? 0) + 1);
    }

    const plansWithUsage = plans.map((plan) => ({
      ...plan,
      active_user_count: usageCount.get(plan.id) ?? 0,
    }));

    return NextResponse.json({ plans: plansWithUsage });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load plans" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireSuperadmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: PlanPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.name || typeof body.price !== "number") {
    return NextResponse.json({ error: "name and price are required" }, { status: 400 });
  }
  if (body.price <= 0) {
    return NextResponse.json({ error: "price must be greater than 0" }, { status: 400 });
  }

  const featureIds = Array.from(
    new Set((body.feature_ids ?? []).map((featureId) => featureId.trim()).filter(Boolean)),
  );
  let features = (body.features ?? []).filter((feature) => feature.trim().length > 0);

  if (featureIds.length > 0) {
    const { data: featureRows, error: featureRowsError } = await supabaseAdmin
      .from("features")
      .select("id, name")
      .in("id", featureIds);

    if (featureRowsError) {
      if (isMissingFeaturesTableError(featureRowsError)) {
        return NextResponse.json(
          { error: "Features table is missing. Run latest migrations." },
          { status: 500 },
        );
      }
      return NextResponse.json({ error: featureRowsError.message }, { status: 500 });
    }

    const namesById = new Map(
      ((featureRows ?? []) as Array<{ id: string; name: string }>).map((row) => [row.id, row.name]),
    );
    const missingFeatureIds = featureIds.filter((id) => !namesById.has(id));
    if (missingFeatureIds.length > 0) {
      return NextResponse.json(
        { error: "One or more selected features were not found" },
        { status: 400 },
      );
    }
    features = featureIds.map((id) => namesById.get(id) as string);
  }

  const status = body.status === "inactive" ? "inactive" : "active";

  const payload = {
    name: body.name.trim(),
    price: body.price,
    interval: body.interval ?? "month",
    stripe_price_id: body.stripe_price_id?.trim() || null,
    is_popular: body.is_popular ?? false,
    status,
    features,
  };

  let insertedPlan: any = null;
  let error: any = null;
  const firstInsert = await supabaseAdmin
    .from("plans")
    .insert(payload)
    .select("*")
    .single();
  insertedPlan = firstInsert.data;
  error = firstInsert.error;

  if (error && isMissingPlanStatusColumnError(error)) {
    const { status: _status, ...payloadWithoutStatus } = payload;
    const fallbackInsert = await supabaseAdmin
      .from("plans")
      .insert(payloadWithoutStatus)
      .select("*")
      .single();
    insertedPlan = fallbackInsert.data;
    error = fallbackInsert.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let data = insertedPlan;
  if (featureIds.length > 0 || features.length > 0) {
    const rows = features.map((feature, index) => ({
      plan_id: data.id,
      feature_id: featureIds[index] ?? null,
      feature: feature.trim(),
      sort_order: index,
    }));
    const { error: featuresError } = await supabaseAdmin.from("plan_features").insert(rows);
    if (featuresError) {
      if (isMissingPlanFeatureIdColumnError(featuresError)) {
        const { error: fallbackInsertError } = await supabaseAdmin.from("plan_features").insert(
          features.map((feature, index) => ({
            plan_id: data.id,
            feature: feature.trim(),
            sort_order: index,
          })),
        );
        if (fallbackInsertError) {
          if (isMissingPlanFeaturesTableError(fallbackInsertError)) {
            const { error: fallbackError } = await supabaseAdmin
              .from("plans")
              .update({ features })
              .eq("id", data.id);
            if (fallbackError) {
              return NextResponse.json({ error: fallbackError.message }, { status: 500 });
            }
          } else {
            return NextResponse.json({ error: fallbackInsertError.message }, { status: 500 });
          }
        }
      } else if (isMissingPlanFeaturesTableError(featuresError)) {
        const { error: fallbackError } = await supabaseAdmin
          .from("plans")
          .update({ features })
          .eq("id", data.id);
        if (fallbackError) {
          return NextResponse.json({ error: fallbackError.message }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: featuresError.message }, { status: 500 });
      }
    }
  }

  let stripePriceId = data.stripe_price_id ?? null;
  if (!stripePriceId) {
    try {
      stripePriceId = await syncStripePriceForPlan({
        planId: data.id,
        name: payload.name,
        price: payload.price,
        interval: payload.interval,
      });
    } catch (stripeError) {
      await supabaseAdmin.from("plans").delete().eq("id", data.id);
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

    const { data: syncedPlan, error: stripeUpdateError } = await supabaseAdmin
      .from("plans")
      .update({ stripe_price_id: stripePriceId })
      .eq("id", data.id)
      .select("*")
      .single();

    if (stripeUpdateError) {
      return NextResponse.json({ error: stripeUpdateError.message }, { status: 500 });
    }
    data = syncedPlan;
  }

  const plans = await loadPlansWithFeatures();
  const createdPlan = plans.find((plan) => plan.id === data.id);

  return NextResponse.json({
    success: true,
    plan:
      createdPlan ??
      ({
        ...data,
        status: data.status ?? status,
        features,
        feature_ids: featureIds,
        active_user_count: 0,
      } as Record<string, unknown>),
  });
}
