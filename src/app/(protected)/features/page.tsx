"use client";

import { useEffect, useMemo, useState } from "react";

type FeatureRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

type PlanRow = {
  id: string;
  name: string;
  feature_ids?: string[] | null;
};

type FeatureFormState = {
  name: string;
  slug: string;
  description: string;
};

type FeatureFormErrors = {
  name?: string;
  slug?: string;
};

const EMPTY_FORM: FeatureFormState = {
  name: "",
  slug: "",
  description: "",
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toFormState(feature: FeatureRow): FeatureFormState {
  return {
    name: feature.name,
    slug: feature.slug,
    description: feature.description ?? "",
  };
}

export default function SuperadminFeaturesPage() {
  const [features, setFeatures] = useState<FeatureRow[]>([]);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
  const [form, setForm] = useState<FeatureFormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FeatureFormErrors>({});

  const [saving, setSaving] = useState(false);
  const [deletingFeatureId, setDeletingFeatureId] = useState<string | null>(
    null,
  );

  const isEditing = !!editingFeatureId;

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [featuresRes, plansRes] = await Promise.all([
        fetch("/api/superadmin/features", { cache: "no-store" }),
        fetch("/api/superadmin/plans", { cache: "no-store" }),
      ]);

      const [featuresPayload, plansPayload] = await Promise.all([
        featuresRes.json(),
        plansRes.json(),
      ]);

      if (!featuresRes.ok) {
        throw new Error(featuresPayload?.error || "Failed to load features");
      }
      if (!plansRes.ok) {
        throw new Error(plansPayload?.error || "Failed to load plans");
      }

      setFeatures((featuresPayload.features ?? []) as FeatureRow[]);
      setPlans((plansPayload.plans ?? []) as PlanRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const usageCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const plan of plans) {
      for (const featureId of plan.feature_ids ?? []) {
        map.set(featureId, (map.get(featureId) ?? 0) + 1);
      }
    }
    return map;
  }, [plans]);

  const openCreateModal = () => {
    setEditingFeatureId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (feature: FeatureRow) => {
    setEditingFeatureId(feature.id);
    setForm(toFormState(feature));
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
    setEditingFeatureId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
  };

  const validateForm = () => {
    const nextErrors: FeatureFormErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Feature name is required";
    }

    if (!isEditing && !form.slug.trim()) {
      nextErrors.slug = "Feature slug is required";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitForm = async () => {
    setError(null);
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const url = isEditing
        ? `/api/superadmin/features/${editingFeatureId}`
        : "/api/superadmin/features";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          ...(isEditing ? {} : { slug: slugify(form.slug) }),
          description: form.description || null,
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(
          payload?.error ||
            `Failed to ${isEditing ? "update" : "create"} feature`,
        );
      }

      closeModal();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save feature");
    } finally {
      setSaving(false);
    }
  };

  const deleteFeature = async (feature: FeatureRow) => {
    const linkedPlanCount = usageCount.get(feature.id) ?? 0;
    if (linkedPlanCount > 0) {
      window.alert(
        "This feature is linked to one or more plans. Remove it from plans first.",
      );
      return;
    }

    const confirmDelete = window.confirm(`Delete feature ${feature.name}?`);
    if (!confirmDelete) return;

    setDeletingFeatureId(feature.id);
    setError(null);
    try {
      const res = await fetch(`/api/superadmin/features/${feature.id}`, {
        method: "DELETE",
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to delete feature");
      }
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete feature");
    } finally {
      setDeletingFeatureId(null);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-primary">
          Super Admin Features
        </h1>
        <p className="text-sm text-gray-500">
          Create reusable features and assign them to plans.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white border rounded-xl p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Features</h2>
          {/*<button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-md bg-primary text-white text-sm"
          >
            Create Feature
          </button>*/}
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-x-auto">
        {loading ? (
          <div className="p-6 text-sm text-gray-600">Loading features...</div>
        ) : (
          <table className="w-full min-w-[780px] text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 font-medium text-gray-600">Slug</th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  Description
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  Linked Plans
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature) => {
                const isDeleting = deletingFeatureId === feature.id;
                return (
                  <tr key={feature.id} className="border-t align-top">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {feature.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{feature.slug}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {feature.description || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {usageCount.get(feature.id) ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(feature)}
                          className="px-3 py-1.5 rounded-md bg-primary text-white"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteFeature(feature)}
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
          <div className="w-full max-w-xl bg-white rounded-xl shadow-xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {isEditing ? "Edit Feature" : "Create Feature"}
              </h2>
              <button
                onClick={closeModal}
                disabled={saving}
                className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                Close
              </button>
            </div>

            <div className="p-4 grid grid-cols-1 gap-3">
              <input
                value={form.name}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((prev) => ({ ...prev, name: value }));
                  if (formErrors.name && value.trim()) {
                    setFormErrors((prev) => ({ ...prev, name: undefined }));
                  }
                }}
                placeholder="Feature name"
                className={`border rounded-md px-3 py-2 text-sm ${
                  formErrors.name ? "border-red-500" : ""
                }`}
              />
              {formErrors.name ? (
                <p className="-mt-1 text-xs text-red-600">{formErrors.name}</p>
              ) : null}

              <input
                value={form.slug}
                onChange={(e) => {
                  if (isEditing) return;
                  const value = e.target.value;
                  setForm((prev) => ({ ...prev, slug: slugify(value) }));
                  if (formErrors.slug && value.trim()) {
                    setFormErrors((prev) => ({ ...prev, slug: undefined }));
                  }
                }}
                placeholder="feature-slug"
                disabled={isEditing}
                className={`border rounded-md px-3 py-2 text-sm ${
                  formErrors.slug ? "border-red-500" : ""
                }`}
              />
              {isEditing ? (
                <p className="-mt-1 text-xs text-gray-500">Slug cannot be edited after creation.</p>
              ) : null}
              {formErrors.slug ? (
                <p className="-mt-1 text-xs text-red-600">{formErrors.slug}</p>
              ) : null}

              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Description (optional)"
                className="border rounded-md px-3 py-2 text-sm min-h-[120px]"
              />
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
                {saving
                  ? "Saving..."
                  : isEditing
                    ? "Save Changes"
                    : "Create Feature"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
