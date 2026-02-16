import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireSuperadmin } from "@/lib/superadmin";
import { isMissingPlanFeaturesTableError, loadPlansWithFeatures } from "@/lib/planFeatures";

type PlanPayload = {
  name?: string;
  price?: number;
  interval?: string | null;
  stripe_price_id?: string | null;
  features?: string[] | null;
  is_popular?: boolean | null;
};

export async function GET() {
  const auth = await requireSuperadmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const plans = await loadPlansWithFeatures();
    return NextResponse.json({ plans });
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

  const payload = {
    name: body.name.trim(),
    price: body.price,
    interval: body.interval ?? "month",
    stripe_price_id: body.stripe_price_id ?? null,
    is_popular: body.is_popular ?? false,
  };

  const { data, error } = await supabaseAdmin
    .from("plans")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const features = (body.features ?? []).filter((feature) => feature.trim().length > 0);
  if (features.length > 0) {
    const { error: featuresError } = await supabaseAdmin.from("plan_features").insert(
      features.map((feature, index) => ({
        plan_id: data.id,
        feature: feature.trim(),
        sort_order: index,
      })),
    );
    if (featuresError) {
      if (isMissingPlanFeaturesTableError(featuresError)) {
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

  return NextResponse.json({
    success: true,
    plan: {
      ...data,
      features,
    },
  });
}
