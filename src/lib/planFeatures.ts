import { supabaseAdmin } from "@/lib/supabaseAdmin";

type PlanBase = {
  id: string;
  name: string;
  price: number;
  interval: string | null;
  stripe_price_id: string | null;
  is_popular: boolean | null;
  features?: string[] | null;
};

type PlanFeatureRow = {
  plan_id: string;
  feature: string;
  sort_order: number;
};

export function getDefaultFeaturesForPlan(planName: string) {
  const normalized = planName.trim().toLowerCase();

  if (normalized.includes("basic") || normalized.includes("starter")) {
    return [
      "Up to 25 products",
      "Up to 10,000 subscribers",
      "Basic analytics",
      "24-hour support",
    ];
  }

  if (normalized.includes("professional") || normalized.includes("pro")) {
    return [
      "Unlimited products",
      "Unlimited subscribers",
      "Advanced analytics",
      "Priority support",
      "Marketing automations",
    ];
  }

  if (normalized.includes("enterprise")) {
    return [
      "Everything in Professional",
      "Dedicated account manager",
      "Custom integrations",
      "SLA support",
      "Advanced security controls",
    ];
  }

  return [
    "Core platform access",
    "Dashboard and reporting",
    "Team collaboration",
    "Email support",
  ];
}

export async function loadPlansWithFeatures() {
  const { data: plans, error: plansError } = await supabaseAdmin
    .from("plans")
    .select("id, name, price, interval, stripe_price_id, is_popular, features")
    .order("price", { ascending: true });

  if (plansError) {
    throw new Error(plansError.message);
  }

  const planRows = (plans ?? []) as PlanBase[];
  const planIds = planRows.map((p) => p.id);
  if (planIds.length === 0) {
    return [];
  }

  const { data: features, error: featuresError } = await supabaseAdmin
    .from("plan_features")
    .select("plan_id, feature, sort_order")
    .in("plan_id", planIds)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (featuresError && !isMissingPlanFeaturesTableError(featuresError)) {
    throw new Error(featuresError.message);
  }

  const featureMap = new Map<string, string[]>();
  if (featuresError && isMissingPlanFeaturesTableError(featuresError)) {
    for (const plan of planRows) {
      featureMap.set(plan.id, plan.features ?? []);
    }
  } else {
    for (const row of (features ?? []) as PlanFeatureRow[]) {
      const current = featureMap.get(row.plan_id) ?? [];
      current.push(row.feature);
      featureMap.set(row.plan_id, current);
    }
  }

  return planRows.map((plan) => ({
    ...plan,
    features:
      (featureMap.get(plan.id) ?? []).length > 0
        ? featureMap.get(plan.id) ?? []
        : getDefaultFeaturesForPlan(plan.name),
  }));
}

export function isMissingPlanFeaturesTableError(error: unknown) {
  const err = error as { code?: string; message?: string } | null;
  const message = err?.message?.toLowerCase() ?? "";
  return (
    err?.code === "42P01" ||
    err?.code === "PGRST205" ||
    (message.includes("plan_features") && message.includes("does not exist"))
  );
}
