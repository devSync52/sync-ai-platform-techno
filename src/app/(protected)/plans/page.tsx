"use client";

import { useEffect, useState } from "react";

type PlanRow = {
  id: string;
  name: string;
  price: number;
  interval: string | null;
  stripe_price_id: string | null;
  features: string[] | null;
  is_popular: boolean | null;
};

function parseFeatureLines(value: string) {
  return value
    .split("\n")
    .map((feature) => feature.trim())
    .filter(Boolean);
}

export default function SuperadminPlansPage() {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [planFeaturesDraft, setPlanFeaturesDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  const [newPlan, setNewPlan] = useState({
    name: "",
    price: "",
    interval: "month",
    stripePriceId: "",
    features: "",
    isPopular: false,
  });

  const loadPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/superadmin/plans", { cache: "no-store" });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to load plans");
      }
      const nextPlans = (payload.plans ?? []) as PlanRow[];
      setPlans(nextPlans);

      const nextDraft: Record<string, string> = {};
      for (const plan of nextPlans) {
        nextDraft[plan.id] = (plan.features ?? []).join("\n");
      }
      setPlanFeaturesDraft(nextDraft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const savePlan = async (plan: PlanRow) => {
    setSavingPlanId(plan.id);
    setError(null);
    try {
      const res = await fetch(`/api/superadmin/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: plan.name,
          price: Number(plan.price),
          interval: plan.interval,
          stripe_price_id: plan.stripe_price_id,
          features: parseFeatureLines(planFeaturesDraft[plan.id] ?? ""),
          is_popular: plan.is_popular ?? false,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to update plan");
      }
      setPlans((prev) => prev.map((row) => (row.id === plan.id ? payload.plan : row)));
      setPlanFeaturesDraft((prev) => ({
        ...prev,
        [plan.id]: (payload.plan.features ?? []).join("\n"),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update plan");
    } finally {
      setSavingPlanId(null);
    }
  };

  const deletePlan = async (plan: PlanRow) => {
    const confirmDelete = window.confirm(`Delete plan ${plan.name}?`);
    if (!confirmDelete) return;

    setDeletingPlanId(plan.id);
    setError(null);
    try {
      const res = await fetch(`/api/superadmin/plans/${plan.id}`, { method: "DELETE" });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to delete plan");
      }
      setPlans((prev) => prev.filter((row) => row.id !== plan.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete plan");
    } finally {
      setDeletingPlanId(null);
    }
  };

  const createPlan = async () => {
    setError(null);
    const price = Number(newPlan.price);
    if (!newPlan.name.trim() || !Number.isFinite(price)) {
      setError("Plan name and valid price are required");
      return;
    }

    try {
      const res = await fetch("/api/superadmin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPlan.name,
          price,
          interval: newPlan.interval || "month",
          stripe_price_id: newPlan.stripePriceId || null,
          features: parseFeatureLines(newPlan.features),
          is_popular: newPlan.isPopular,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to create plan");
      }

      setPlans((prev) => [...prev, payload.plan]);
      setPlanFeaturesDraft((prev) => ({
        ...prev,
        [payload.plan.id]: (payload.plan.features ?? []).join("\n"),
      }));
      setNewPlan({
        name: "",
        price: "",
        interval: "month",
        stripePriceId: "",
        features: "",
        isPopular: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create plan");
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Super Admin Plans</h1>
        <p className="text-sm text-gray-500">Create and maintain dynamic plans and features.</p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white border rounded-xl p-4 grid gap-3 md:grid-cols-2">
        <input
          value={newPlan.name}
          onChange={(e) => setNewPlan((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Plan name"
          className="border rounded-md px-3 py-2 text-sm"
        />
        <input
          value={newPlan.price}
          onChange={(e) => setNewPlan((prev) => ({ ...prev, price: e.target.value }))}
          placeholder="Price (e.g. 49.99)"
          className="border rounded-md px-3 py-2 text-sm"
        />
        <input
          value={newPlan.interval}
          onChange={(e) => setNewPlan((prev) => ({ ...prev, interval: e.target.value }))}
          placeholder="Interval (month/year)"
          className="border rounded-md px-3 py-2 text-sm"
        />
        <input
          value={newPlan.stripePriceId}
          onChange={(e) => setNewPlan((prev) => ({ ...prev, stripePriceId: e.target.value }))}
          placeholder="Stripe price id (optional)"
          className="border rounded-md px-3 py-2 text-sm"
        />
        <textarea
          value={newPlan.features}
          onChange={(e) => setNewPlan((prev) => ({ ...prev, features: e.target.value }))}
          placeholder="Features (one per line)"
          className="border rounded-md px-3 py-2 text-sm min-h-[120px] md:col-span-2"
        />
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={newPlan.isPopular}
            onChange={(e) => setNewPlan((prev) => ({ ...prev, isPopular: e.target.checked }))}
          />
          Mark as popular
        </label>
        <div>
          <button onClick={createPlan} className="px-4 py-2 rounded-md bg-primary text-white">
            Create Plan
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="bg-white border rounded-xl p-6 text-sm text-gray-600">Loading plans...</div>
        ) : (
          plans.map((plan) => {
            const isSaving = savingPlanId === plan.id;
            const isDeleting = deletingPlanId === plan.id;

            return (
              <div key={plan.id} className="bg-white border rounded-xl p-4 grid gap-3 md:grid-cols-2">
                <input
                  value={plan.name}
                  onChange={(e) =>
                    setPlans((prev) =>
                      prev.map((row) => (row.id === plan.id ? { ...row, name: e.target.value } : row)),
                    )
                  }
                  className="border rounded-md px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  step="0.01"
                  value={plan.price}
                  onChange={(e) =>
                    setPlans((prev) =>
                      prev.map((row) =>
                        row.id === plan.id ? { ...row, price: Number(e.target.value) } : row,
                      ),
                    )
                  }
                  className="border rounded-md px-3 py-2 text-sm"
                />
                <input
                  value={plan.interval ?? ""}
                  onChange={(e) =>
                    setPlans((prev) =>
                      prev.map((row) => (row.id === plan.id ? { ...row, interval: e.target.value } : row)),
                    )
                  }
                  className="border rounded-md px-3 py-2 text-sm"
                />
                <input
                  value={plan.stripe_price_id ?? ""}
                  onChange={(e) =>
                    setPlans((prev) =>
                      prev.map((row) =>
                        row.id === plan.id ? { ...row, stripe_price_id: e.target.value } : row,
                      ),
                    )
                  }
                  className="border rounded-md px-3 py-2 text-sm"
                />
                <textarea
                  value={planFeaturesDraft[plan.id] ?? ""}
                  onChange={(e) => setPlanFeaturesDraft((prev) => ({ ...prev, [plan.id]: e.target.value }))}
                  className="border rounded-md px-3 py-2 text-sm min-h-[120px] md:col-span-2"
                />
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!plan.is_popular}
                    onChange={(e) =>
                      setPlans((prev) =>
                        prev.map((row) =>
                          row.id === plan.id ? { ...row, is_popular: e.target.checked } : row,
                        ),
                      )
                    }
                  />
                  Popular
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => savePlan(plan)}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-md bg-primary text-white disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save Plan"}
                  </button>
                  <button
                    onClick={() => deletePlan(plan)}
                    disabled={isDeleting}
                    className="px-4 py-2 rounded-md bg-red-600 text-white disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting..." : "Delete Plan"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
