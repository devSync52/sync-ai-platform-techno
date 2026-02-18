"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { GenderSelect } from "@/components/ui/genderSelect";
import { Eye } from "lucide-react";

type UserStatus = "active" | "disabled";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  account_id: string | null;
  plan_id: string | null;
  created_at: string | null;
  last_login_at: string | null;
  has_logged_in: boolean | null;
  status: UserStatus;
  user_details: {
    gender: string | null;
    birth_date: string | null;
    address_line_1: string | null;
    address_line_2: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postal_code: string | null;
  } | null;
  account: {
    id: string;
    name: string | null;
    tax_id: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    address_line_1: string | null;
    address_line_2: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
    country: string | null;
    status: string | null;
  } | null;
};

type PlanRow = {
  id: string;
  name: string;
  price: number;
  interval: string | null;
};

type EditableUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  birth_date: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  account_name: string;
  account_email: string;
  account_phone: string;
  account_website: string;
  account_tax_id: string;
  account_address_line_1: string;
  account_address_line_2: string;
  account_city: string;
  account_state: string;
  account_zip_code: string;
  account_country: string;
  account_status: string;
  role: string;
  planId: string;
  status: UserStatus;
};

const ROLE_OPTIONS = [
  "superadmin",
  "admin",
  "staff-admin",
  "staff-user",
  "staff-client",
  "client",
];

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function toEditableUser(user: UserRow): EditableUser {
  return {
    id: user.id,
    name: user.name ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    gender: user.user_details?.gender ?? "",
    birth_date: user.user_details?.birth_date ?? "",
    address_line_1: user.user_details?.address_line_1 ?? "",
    address_line_2: user.user_details?.address_line_2 ?? "",
    city: user.user_details?.city ?? "",
    state: user.user_details?.state ?? "",
    country: user.user_details?.country ?? "",
    postal_code: user.user_details?.postal_code ?? "",
    account_name: user.account?.name ?? "",
    account_email: user.account?.email ?? "",
    account_phone: user.account?.phone ?? "",
    account_website: user.account?.website ?? "",
    account_tax_id: user.account?.tax_id ?? "",
    account_address_line_1: user.account?.address_line_1 ?? "",
    account_address_line_2: user.account?.address_line_2 ?? "",
    account_city: user.account?.city ?? "",
    account_state: user.account?.state ?? "",
    account_zip_code: user.account?.zip_code ?? "",
    account_country: user.account?.country ?? "",
    account_status: user.account?.status ?? "",
    role: user.role,
    planId: user.plan_id ?? "",
    status: user.status ?? "active",
  };
}

export default function SuperadminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<EditableUser | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, plansRes] = await Promise.all([
        fetch("/api/superadmin/users", { cache: "no-store" }),
        fetch("/api/superadmin/plans", { cache: "no-store" }),
      ]);

      const usersPayload = await usersRes.json();
      const plansPayload = await plansRes.json();

      if (!usersRes.ok) {
        throw new Error(usersPayload?.error || "Failed to load users");
      }
      if (!plansRes.ok) {
        throw new Error(plansPayload?.error || "Failed to load plans");
      }

      setUsers(
        ((usersPayload.users ?? []) as UserRow[]).filter(
          (user) => user.role === "admin",
        ),
      );
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

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) => {
      return (
        user.email.toLowerCase().includes(term) ||
        (user.name ?? "").toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term)
      );
    });
  }, [users, search]);

  const saveUserFromModal = async () => {
    if (!editingUser) return;

    setSavingUserId(editingUser.id);
    setError(null);

    try {
      const res = await fetch(`/api/superadmin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingUser.name || null,
          email: editingUser.email,
          phone: editingUser.phone || null,
          gender: editingUser.gender || null,
          birth_date: editingUser.birth_date || null,
          address_line_1: editingUser.address_line_1 || null,
          address_line_2: editingUser.address_line_2 || null,
          city: editingUser.city || null,
          state: editingUser.state || null,
          country: editingUser.country || null,
          postal_code: editingUser.postal_code || null,
          account_name: editingUser.account_name || null,
          account_email: editingUser.account_email || null,
          account_phone: editingUser.account_phone || null,
          account_website: editingUser.account_website || null,
          account_tax_id: editingUser.account_tax_id || null,
          account_address_line_1: editingUser.account_address_line_1 || null,
          account_address_line_2: editingUser.account_address_line_2 || null,
          account_city: editingUser.account_city || null,
          account_state: editingUser.account_state || null,
          account_zip_code: editingUser.account_zip_code || null,
          account_country: editingUser.account_country || null,
          account_status: editingUser.account_status || null,
          role: editingUser.role,
          planId: editingUser.planId || null,
          status: editingUser.status,
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to update user");
      }

      setUsers((prev) =>
        prev
          .map((row) =>
            row.id === editingUser.id
              ? {
                  ...row,
                  name: editingUser.name || null,
                  email: editingUser.email,
                  phone: editingUser.phone || null,
                  role: editingUser.role,
                  plan_id: editingUser.planId || null,
                  status: editingUser.status,
                  user_details: {
                    ...(row.user_details ?? {
                      gender: null,
                      birth_date: null,
                      address_line_1: null,
                      address_line_2: null,
                      city: null,
                      state: null,
                      country: null,
                      postal_code: null,
                    }),
                    gender: editingUser.gender || null,
                    birth_date: editingUser.birth_date || null,
                    address_line_1: editingUser.address_line_1 || null,
                    address_line_2: editingUser.address_line_2 || null,
                    city: editingUser.city || null,
                    state: editingUser.state || null,
                    country: editingUser.country || null,
                    postal_code: editingUser.postal_code || null,
                  },
                  account: row.account
                    ? {
                        ...row.account,
                        name: editingUser.account_name || null,
                        email: editingUser.account_email || null,
                        phone: editingUser.account_phone || null,
                        website: editingUser.account_website || null,
                        tax_id: editingUser.account_tax_id || null,
                        address_line_1:
                          editingUser.account_address_line_1 || null,
                        address_line_2:
                          editingUser.account_address_line_2 || null,
                        city: editingUser.account_city || null,
                        state: editingUser.account_state || null,
                        zip_code: editingUser.account_zip_code || null,
                        country: editingUser.account_country || null,
                        status: editingUser.account_status || null,
                      }
                    : null,
                }
              : row,
          )
          .filter((row) => row.role === "admin"),
      );

      setEditingUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setSavingUserId(null);
    }
  };

  const deleteUser = async (user: UserRow) => {
    const confirmDelete = window.confirm(`Delete user ${user.email}?`);
    if (!confirmDelete) return;

    setDeletingUserId(user.id);
    setError(null);
    try {
      const res = await fetch(`/api/superadmin/users/${user.id}`, {
        method: "DELETE",
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to delete user");
      }
      setUsers((prev) => prev.filter((row) => row.id !== user.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Admin Users</h1>
        <p className="text-sm text-gray-500">Manage admin users</p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white border rounded-xl p-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email, name, or role"
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div className="bg-white border rounded-xl overflow-x-auto">
        {loading ? (
          <div className="p-6 text-sm text-gray-600">Loading users...</div>
        ) : (
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">User</th>
                <th className="px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600">Plan</th>
                <th className="px-4 py-3 font-medium text-gray-600">Account</th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  Last Login
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const isDeleting = deletingUserId === user.id;
                return (
                  <tr key={user.id} className="border-t">
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium text-gray-900">
                        {user.name || "Unnamed"}
                      </div>
                      <div className="text-gray-600">{user.email}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Created: {formatDate(user.created_at)}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">{user.role}</td>
                    <td className="px-4 py-3 align-top">{user.status}</td>
                    <td className="px-4 py-3 align-top">
                      {plans.find((p) => p.id === user.plan_id)?.name ??
                        "No plan"}
                    </td>
                    <td className="px-4 py-3 align-top text-gray-600">
                      {user.account?.name || user.account_id || "—"}
                    </td>
                    <td className="px-4 py-3 align-top text-gray-600">
                      {formatDate(user.last_login_at)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex gap-2">
                        <Link
                          href={`/users/${user.id}`}
                          className="px-3 py-1.5 rounded-md border border-primary text-primary flex items-center gap-1.5"
                        >
                          <Eye size={16} />
                          View
                        </Link>
                        <button
                          onClick={() => setEditingUser(toEditableUser(user))}
                          className="px-3 py-1.5 rounded-md bg-primary text-white"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteUser(user)}
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

      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Edit User</h2>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[70vh] overflow-auto">
              <div className="md:col-span-2 text-sm font-medium text-gray-700">
                User Details
              </div>
              <input
                value={editingUser.name}
                onChange={(e) =>
                  setEditingUser((prev) =>
                    prev ? { ...prev, name: e.target.value } : prev,
                  )
                }
                placeholder="Name"
                className="border rounded-md px-3 py-2 text-sm"
              />
              {/* <input
                value={editingUser.email}
                onChange={(e) =>
                  setEditingUser((prev) =>
                    prev ? { ...prev, email: e.target.value } : prev,
                  )
                }
                disabled
                placeholder="Email"
                className="border rounded-md px-3 py-2 text-sm"
              /> */}
              {/* <div className="w-full">
                <PhoneInput
                  country="us"
                  value={editingUser.phone}
                  onChange={(value) =>
                    setEditingUser((prev) =>
                      prev ? { ...prev, phone: value } : prev,
                    )
                  }
                  inputClass="!w-full !h-10 !text-sm"
                  containerClass="w-full"
                  inputProps={{
                    name: "phone",
                    autoFocus: false,
                  }}
                />
              </div> */}
              <GenderSelect
                value={editingUser.gender}
                onChange={(value) =>
                  setEditingUser((prev) =>
                    prev ? { ...prev, gender: value } : prev,
                  )
                }
              />
              <input
                type="date"
                value={editingUser.birth_date}
                onChange={(e) =>
                  setEditingUser((prev) =>
                    prev ? { ...prev, birth_date: e.target.value } : prev,
                  )
                }
                className="border rounded-md px-3 py-2 text-sm"
              />
              <select
                value={editingUser.role}
                onChange={(e) =>
                  setEditingUser((prev) =>
                    prev ? { ...prev, role: e.target.value } : prev,
                  )
                }
                className="border rounded-md px-3 py-2 text-sm"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <select
                value={editingUser.status}
                onChange={(e) =>
                  setEditingUser((prev) =>
                    prev
                      ? { ...prev, status: e.target.value as UserStatus }
                      : prev,
                  )
                }
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="active">active</option>
                <option value="disabled">disabled</option>
              </select>
              <select
                value={editingUser.planId}
                onChange={(e) =>
                  setEditingUser((prev) =>
                    prev ? { ...prev, planId: e.target.value } : prev,
                  )
                }
                disabled
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="">No plan</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} (${plan.price}/{plan.interval || "month"})
                  </option>
                ))}
              </select>
              {/* <input
                value={editingUser.address_line_1}
                onChange={(e) =>
                  setEditingUser((prev) =>
                    prev ? { ...prev, address_line_1: e.target.value } : prev,
                  )
                }
                placeholder="Address line 1"
                className="border rounded-md px-3 py-2 text-sm md:col-span-2"
              />
              <input
                value={editingUser.address_line_2}
                onChange={(e) =>
                  setEditingUser((prev) =>
                    prev ? { ...prev, address_line_2: e.target.value } : prev,
                  )
                }
                placeholder="Address line 2"
                className="border rounded-md px-3 py-2 text-sm md:col-span-2"
              />
              <input
                value={editingUser.city}
                onChange={(e) =>
                  setEditingUser((prev) =>
                    prev ? { ...prev, city: e.target.value } : prev,
                  )
                }
                placeholder="City"
                className="border rounded-md px-3 py-2 text-sm"
              />
              <input
                value={editingUser.state}
                onChange={(e) =>
                  setEditingUser((prev) =>
                    prev ? { ...prev, state: e.target.value } : prev,
                  )
                }
                placeholder="State"
                className="border rounded-md px-3 py-2 text-sm"
              />
              <input
                value={editingUser.country}
                onChange={(e) =>
                  setEditingUser((prev) =>
                    prev ? { ...prev, country: e.target.value } : prev,
                  )
                }
                placeholder="Country"
                className="border rounded-md px-3 py-2 text-sm"
              />
              <input
                value={editingUser.postal_code}
                onChange={(e) =>
                  setEditingUser((prev) =>
                    prev ? { ...prev, postal_code: e.target.value } : prev,
                  )
                }
                placeholder="Postal code"
                className="border rounded-md px-3 py-2 text-sm"
              /> */}
              <div className="md:col-span-2 mt-2 text-sm font-medium text-gray-700">
                Account Details
              </div>
              <input
                value={editingUser.account_name}
                onChange={(e) =>
                  setEditingUser((prev) =>
                    prev ? { ...prev, account_name: e.target.value } : prev,
                  )
                }
                placeholder="Account name"
                className="border rounded-md px-3 py-2 text-sm"
              />
              <input
                value={editingUser.account_email}
                onChange={(e) =>
                  setEditingUser((prev) =>
                    prev ? { ...prev, account_email: e.target.value } : prev,
                  )
                }
                disabled
                placeholder="Account email"
                className="border rounded-md px-3 py-2 text-sm"
              />
              <div className="w-full">
                <PhoneInput
                  country="us"
                  value={editingUser.account_phone}
                  onChange={(value) =>
                    setEditingUser((prev) =>
                      prev ? { ...prev, account_phone: value } : prev,
                    )
                  }
                  inputClass="!w-full !h-10 !text-sm"
                  containerClass="w-full"
                  inputProps={{
                    name: "account_phone",
                    autoFocus: false,
                  }}
                />
              </div>
              {/* <input
                value={editingUser.account_website}
                onChange={(e) =>
                  setEditingUser((prev) =>
                    prev ? { ...prev, account_website: e.target.value } : prev,
                  )
                }
                placeholder="Account website"
                className="border rounded-md px-3 py-2 text-sm"
              />
              <input
                value={editingUser.account_tax_id}
                onChange={(e) =>
                  setEditingUser((prev) =>
                    prev ? { ...prev, account_tax_id: e.target.value } : prev,
                  )
                }
                placeholder="Tax ID"
                className="border rounded-md px-3 py-2 text-sm"
              /> */}
              {/* <input
                value={editingUser.account_status}
                onChange={(e) =>
                  setEditingUser((prev) =>
                    prev ? { ...prev, account_status: e.target.value } : prev,
                  )
                }
                placeholder="Account status"
                className="border rounded-md px-3 py-2 text-sm"
              /> */}
              <input
                value={editingUser.account_address_line_1}
                onChange={(e) =>
                  setEditingUser((prev) =>
                    prev
                      ? { ...prev, account_address_line_1: e.target.value }
                      : prev,
                  )
                }
                placeholder="Account address line 1"
                className="border rounded-md px-3 py-2 text-sm md:col-span-2"
              />
              <input
                value={editingUser.account_address_line_2}
                onChange={(e) =>
                  setEditingUser((prev) =>
                    prev
                      ? { ...prev, account_address_line_2: e.target.value }
                      : prev,
                  )
                }
                placeholder="Account address line 2"
                className="border rounded-md px-3 py-2 text-sm md:col-span-2"
              />
              <input
                value={editingUser.account_city}
                onChange={(e) =>
                  setEditingUser((prev) =>
                    prev ? { ...prev, account_city: e.target.value } : prev,
                  )
                }
                placeholder="Account city"
                className="border rounded-md px-3 py-2 text-sm"
              />
              <input
                value={editingUser.account_state}
                onChange={(e) =>
                  setEditingUser((prev) =>
                    prev ? { ...prev, account_state: e.target.value } : prev,
                  )
                }
                placeholder="Account state"
                className="border rounded-md px-3 py-2 text-sm"
              />
              <input
                value={editingUser.account_country}
                onChange={(e) =>
                  setEditingUser((prev) =>
                    prev ? { ...prev, account_country: e.target.value } : prev,
                  )
                }
                placeholder="Account country"
                className="border rounded-md px-3 py-2 text-sm"
              />
              <input
                value={editingUser.account_zip_code}
                onChange={(e) =>
                  setEditingUser((prev) =>
                    prev ? { ...prev, account_zip_code: e.target.value } : prev,
                  )
                }
                placeholder="Account zip code"
                className="border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-md border"
              >
                Cancel
              </button>
              <button
                onClick={saveUserFromModal}
                disabled={savingUserId === editingUser.id}
                className="px-4 py-2 rounded-md bg-primary text-white disabled:opacity-50"
              >
                {savingUserId === editingUser.id ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
