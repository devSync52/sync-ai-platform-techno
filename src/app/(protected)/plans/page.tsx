"use client";

import { useEffect, useMemo, useState } from "react";

type PlanRow = {
  id: string;
  name: string;
  price: number;
  interval: string | null;
  stripe_price_id: string | null;
  features: string[] | null;
  is_popular: boolean | null;
  status?: "active" | "inactive" | null;
  active_user_count?: number;
};

type PlanFormState = {
  name: string;
  price: string;
  interval: string;
  stripePriceId: string;
  features: string;
  isPopular: boolean;
  status: "active" | "inactive";
};

const EMPTY_FORM: PlanFormState = {
  name: "",
  price: "",
  interval: "month",
  stripePriceId: "",
  features: "",
  isPopular: false,
  status: "active",
};

function parseFeatureLines(value: string) {
  return value
    .split("\n")
    .map((feature) => feature.trim())
    .filter(Boolean);
}

function toFormState(plan: PlanRow): PlanFormState {
  return {
    name: plan.name,
    price: String(plan.price ?? ""),
    interval: plan.interval ?? "month",
    stripePriceId: plan.stripe_price_id ?? "",
    features: (plan.features ?? []).join("\n"),
    isPopular: !!plan.is_popular,
    status: plan.status === "inactive" ? "inactive" : "active",
  };
}

export default function SuperadminPlansPage() {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanFormState>(EMPTY_FORM);

  const [saving, setSaving] = useState(false);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  const isEditing = !!editingPlanId;

  const loadPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/superadmin/plans", { cache: "no-store" });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to load plans");
      }
      setPlans((payload.plans ?? []) as PlanRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => Number(a.price) - Number(b.price)),
    [plans],
  );

  const openCreateModal = () => {
    setEditingPlanId(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (plan: PlanRow) => {
    setEditingPlanId(plan.id);
    setForm(toFormState(plan));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
    setEditingPlanId(null);
    setForm(EMPTY_FORM);
  };

  const submitForm = async () => {
    setError(null);
    const price = Number(form.price);

    if (!form.name.trim() || !Number.isFinite(price) || price <= 0) {
      setError("Plan name and a valid price greater than 0 are required");
      return;
    }

    setSaving(true);
    try {
      const url = isEditing
        ? `/api/superadmin/plans/${editingPlanId}`
        : "/api/superadmin/plans";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          price,
          interval: form.interval || "month",
          stripe_price_id: form.stripePriceId || null,
          features: parseFeatureLines(form.features),
          is_popular: form.isPopular,
          status: form.status,
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || `Failed to ${isEditing ? "update" : "create"} plan`);
      }

      closeModal();
      await loadPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  const deletePlan = async (plan: PlanRow) => {
    if ((plan.active_user_count ?? 0) > 0) {
      window.alert("This plan is assigned to users and cannot be deleted.");
      return;
    }

    const confirmDelete = window.confirm(`Delete plan ${plan.name}?`);
    if (!confirmDelete) return;

    setDeletingPlanId(plan.id);
    setError(null);
    try {
      const res = await fetch(`/api/superadmin/plans/${plan.id}`, { method: "DELETE" });
      const payload = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          window.alert(payload?.error || "This plan cannot be deleted.");
          await loadPlans();
          return;
        }
        throw new Error(payload?.error || "Failed to delete plan");
      }
      await loadPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete plan");
    } finally {
      setDeletingPlanId(null);
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

      <div className="bg-white border rounded-xl p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Plans</h2>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-md bg-primary text-white text-sm"
          >
            Create Plan
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-x-auto">
        {loading ? (
          <div className="p-6 text-sm text-gray-600">Loading plans...</div>
        ) : (
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 font-medium text-gray-600">Price</th>
                <th className="px-4 py-3 font-medium text-gray-600">Interval</th>
                <th className="px-4 py-3 font-medium text-gray-600">Stripe Price ID</th>
                <th className="px-4 py-3 font-medium text-gray-600">Popular</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600">Features</th>
                <th className="px-4 py-3 font-medium text-gray-600">Assigned Users</th>
                <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlans.map((plan) => {
                const isDeleting = deletingPlanId === plan.id;
                return (
                  <tr key={plan.id} className="border-t align-top">
                    <td className="px-4 py-3 font-medium text-gray-900">{plan.name}</td>
                    <td className="px-4 py-3">${Number(plan.price).toFixed(2)}</td>
                    <td className="px-4 py-3">{plan.interval || "month"}</td>
                    <td className="px-4 py-3 text-gray-600">{plan.stripe_price_id || "—"}</td>
                    <td className="px-4 py-3">{plan.is_popular ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          (plan.status ?? "active") === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {(plan.status ?? "active") === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{(plan.features ?? []).length}</td>
                    <td className="px-4 py-3 text-gray-600">{plan.active_user_count ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(plan)}
                          className="px-3 py-1.5 rounded-md bg-primary text-white"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deletePlan(plan)}
                          disabled={isDeleting}
                          className="px-3 py-1.5 rounded-md bg-red-600 text-white disabled:opacity-50"
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">{isEditing ? "Edit Plan" : "Create Plan"}</h2>
              <button
                onClick={closeModal}
                disabled={saving}
                className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                Close
              </button>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Plan name"
                className="border rounded-md px-3 py-2 text-sm"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="Price (e.g. 49.99)"
                className="border rounded-md px-3 py-2 text-sm"
              />
              <select
                value={form.interval}
                onChange={(e) => setForm((prev) => ({ ...prev, interval: e.target.value }))}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="month">month</option>
                <option value="year">year</option>
              </select>
              <input
                value={form.stripePriceId}
                onChange={(e) => setForm((prev) => ({ ...prev, stripePriceId: e.target.value }))}
                placeholder="Stripe price id (optional)"
                className="border rounded-md px-3 py-2 text-sm"
              />
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    status: e.target.value === "inactive" ? "inactive" : "active",
                  }))
                }
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <textarea
                value={form.features}
                onChange={(e) => setForm((prev) => ({ ...prev, features: e.target.value }))}
                placeholder="Features (one per line)"
                className="border rounded-md px-3 py-2 text-sm min-h-[140px] md:col-span-2"
              />
              <label className="inline-flex items-center gap-2 text-sm md:col-span-2">
                <input
                  type="checkbox"
                  checked={form.isPopular}
                  onChange={(e) => setForm((prev) => ({ ...prev, isPopular: e.target.checked }))}
                />
                Mark as popular
              </label>
            </div>

            <div className="p-4 border-t flex items-center justify-end gap-2">
              <button
                onClick={closeModal}
                disabled={saving}
                className="px-4 py-2 rounded-md border text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submitForm}
                disabled={saving}
                className="px-4 py-2 rounded-md bg-primary text-white text-sm disabled:opacity-50"
              >
                {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Plan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
