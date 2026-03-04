import { supabaseAdmin } from "@/lib/supabaseAdmin";

type PlanBase = {
  id: string;
  name: string;
  price: number;
  interval: string | null;
  stripe_price_id: string | null;
  is_popular: boolean | null;
  status?: "active" | "inactive" | null;
  features?: string[] | null;
};

type PlanFeatureRow = {
  plan_id: string;
  feature_id?: string | null;
  feature?: string | null;
  sort_order: number;
};

type FeatureRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
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
  let plans: any[] | null = null;
  let plansError: any = null;

  const withStatus = await supabaseAdmin
    .from("plans")
    .select("id, name, price, interval, stripe_price_id, is_popular, status, features")
    .order("price", { ascending: true });

  if (withStatus.error && isMissingPlanStatusColumnError(withStatus.error)) {
    const withoutStatus = await supabaseAdmin
      .from("plans")
      .select("id, name, price, interval, stripe_price_id, is_popular, features")
      .order("price", { ascending: true });
    plans = withoutStatus.data as any[] | null;
    plansError = withoutStatus.error;
  } else {
    plans = withStatus.data as any[] | null;
    plansError = withStatus.error;
  }

  if (plansError) {
    throw new Error(plansError.message);
  }

  const planRows = (plans ?? []) as PlanBase[];
  const planIds = planRows.map((p) => p.id);
  if (planIds.length === 0) {
    return [];
  }

  let planFeatures: PlanFeatureRow[] | null = null;
  let featuresError: unknown = null;
  const withFeatureId = await supabaseAdmin
    .from("plan_features")
    .select("plan_id, feature_id, feature, sort_order")
    .in("plan_id", planIds)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (withFeatureId.error && isMissingPlanFeatureIdColumnError(withFeatureId.error)) {
    const withoutFeatureId = await supabaseAdmin
      .from("plan_features")
      .select("plan_id, feature, sort_order")
      .in("plan_id", planIds)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });
    planFeatures = withoutFeatureId.data as PlanFeatureRow[] | null;
    featuresError = withoutFeatureId.error;
  } else {
    planFeatures = withFeatureId.data as PlanFeatureRow[] | null;
    featuresError = withFeatureId.error;
  }

  if (featuresError && !isMissingPlanFeaturesTableError(featuresError)) {
    throw new Error((featuresError as { message?: string }).message ?? "Failed to load plan features");
  }

  const featureMap = new Map<string, string[]>();
  const featureIdMap = new Map<string, string[]>();
  if (featuresError && isMissingPlanFeaturesTableError(featuresError)) {
    for (const plan of planRows) {
      featureMap.set(plan.id, plan.features ?? []);
      featureIdMap.set(plan.id, []);
    }
  } else {
    const featureIds = Array.from(
      new Set(
        (planFeatures ?? [])
          .map((row) => row.feature_id)
          .filter((featureId): featureId is string => !!featureId),
      ),
    );

    let featureNameById = new Map<string, string>();
    if (featureIds.length > 0) {
      const { data: definitions, error: definitionsError } = await supabaseAdmin
        .from("features")
        .select("id, name")
        .in("id", featureIds);

      if (definitionsError && !isMissingFeaturesTableError(definitionsError)) {
        throw new Error(definitionsError.message);
      }

      featureNameById = new Map(
        ((definitions ?? []) as Array<{ id: string; name: string }>).map((item) => [
          item.id,
          item.name,
        ]),
      );
    }

    for (const row of planFeatures ?? []) {
      const currentNames = featureMap.get(row.plan_id) ?? [];
      const currentIds = featureIdMap.get(row.plan_id) ?? [];
      const featureName =
        (row.feature_id ? featureNameById.get(row.feature_id) : null) ?? row.feature ?? null;

      if (featureName) {
        currentNames.push(featureName);
      }
      if (row.feature_id) {
        currentIds.push(row.feature_id);
      }

      featureMap.set(row.plan_id, currentNames);
      featureIdMap.set(row.plan_id, currentIds);
    }
  }

  return planRows.map((plan) => ({
    ...plan,
    status: plan.status ?? "active",
    features:
      (featureMap.get(plan.id) ?? []).length > 0
        ? featureMap.get(plan.id) ?? []
        : getDefaultFeaturesForPlan(plan.name),
    feature_ids: featureIdMap.get(plan.id) ?? [],
  }));
}

export async function loadFeatureCatalog() {
  const { data, error } = await supabaseAdmin
    .from("features")
    .select("id, name, slug, description")
    .order("name", { ascending: true });

  if (error) {
    if (isMissingFeaturesTableError(error)) {
      return [] as FeatureRow[];
    }
    throw new Error(error.message);
  }

  return (data ?? []) as FeatureRow[];
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

export function isMissingPlanStatusColumnError(error: unknown) {
  const err = error as { code?: string; message?: string } | null;
  const message = err?.message?.toLowerCase() ?? "";
  return (
    err?.code === "42703" ||
    err?.code === "PGRST204" ||
    (message.includes("column") && message.includes("status") && message.includes("plans"))
  );
}

export function isMissingFeaturesTableError(error: unknown) {
  const err = error as { code?: string; message?: string } | null;
  const message = err?.message?.toLowerCase() ?? "";
  return (
    err?.code === "42P01" ||
    err?.code === "PGRST205" ||
    (message.includes("features") && message.includes("does not exist"))
  );
}

export function isMissingPlanFeatureIdColumnError(error: unknown) {
  const err = error as { code?: string; message?: string } | null;
  const message = err?.message?.toLowerCase() ?? "";
  return (
    err?.code === "42703" ||
    err?.code === "PGRST204" ||
    (message.includes("column") && message.includes("feature_id") && message.includes("plan_features"))
  );
}
