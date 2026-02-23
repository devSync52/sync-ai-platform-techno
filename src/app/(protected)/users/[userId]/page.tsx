"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { GenderSelect } from "@/components/ui/genderSelect";
import {
  ChevronLeft,
  Crown,
  DownloadIcon,
  Eye,
  SquarePen,
  Trash2,
} from "lucide-react";

type UserStatus = "active" | "disabled";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  account_id: string | null;
  plan_id: string | null;
  created_by_user_id: string | null;
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
  status?: "active" | "inactive" | null;
};

type InvoiceRow = {
  id: string;
  number: string | null;
  user?: {
    id: string | null;
    name: string | null;
    email: string | null;
  } | null;
  plan: {
    name: string | null;
    interval: string | null;
    amount: number | null;
    currency: string | null;
  };
  currency: string;
  status: string;
  createdAt: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  downloadUrl: string | null;
  receiptUrl: string | null;
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

type UserListTab = "staff" | "customer";

const ROLE_OPTIONS = [
  "superadmin",
  "admin",
  "staff-admin",
  "staff-user",
  "staff-client",
  "client",
];

function formatRoleLabel(role: string | null | undefined) {
  if (!role) return "-";
  const map: Record<string, string> = {
    superadmin: "Super Admin",
    admin: "Admin",
    "staff-admin": "Staff Admin",
    "staff-user": "Staff User",
    "staff-client": "Staff Customer User",
    client: "Customer User",
  };
  return map[role] ?? role;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatShortDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US");
}

function formatCurrency(value: number | null, currency = "USD") {
  const amount = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency,
  });
}

function getInitials(name: string | null, email: string) {
  const source = (name || email || "U").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
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

export default function SuperadminUserDetailsPage() {
  const router = useRouter();
  const params = useParams<{ userId: string }>();
  const userId = params?.userId;

  const [users, setUsers] = useState<UserRow[]>([]);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);
  const [cancelSubscriptionMessage, setCancelSubscriptionMessage] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<EditableUser | null>(null);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [activeUserTab, setActiveUserTab] = useState<UserListTab>("staff");

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [usersRes, plansRes, invoicesRes] = await Promise.all([
          fetch("/api/superadmin/users", { cache: "no-store" }),
          fetch("/api/superadmin/plans", { cache: "no-store" }),
          fetch("/api/stripe/invoices", { cache: "no-store" }),
        ]);

        const [usersPayload, plansPayload, invoicesPayload] = await Promise.all([
          usersRes.json(),
          plansRes.json(),
          invoicesRes.json(),
        ]);

        if (!usersRes.ok) {
          throw new Error(usersPayload?.error || "Failed to load users");
        }
        if (!plansRes.ok) {
          throw new Error(plansPayload?.error || "Failed to load plans");
        }
        if (!invoicesRes.ok) {
          throw new Error(invoicesPayload?.error || "Failed to load invoices");
        }

        setUsers((usersPayload.users ?? []) as UserRow[]);
        setPlans((plansPayload.plans ?? []) as PlanRow[]);
        setInvoices((invoicesPayload.data ?? []) as InvoiceRow[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === userId) ?? null,
    [users, userId],
  );

  const currentPlan = useMemo(() => {
    const rawPlanId = selectedUser?.plan_id;
    const planId = typeof rawPlanId === "string" ? rawPlanId.trim() : "";
    if (!planId) return null;
    return plans.find((plan) => plan.id === planId) ?? null;
  }, [plans, selectedUser]);
  const hasAssignedPlanId = Boolean(
    selectedUser?.plan_id && String(selectedUser.plan_id).trim(),
  );
  const hasActivePlan = hasAssignedPlanId && Boolean(currentPlan);

  const userInvoices = useMemo(() => {
    if (!selectedUser) return [];
    if (!hasActivePlan) return [];
    return invoices.filter((invoice) => invoice.user?.id === selectedUser.id);
  }, [invoices, selectedUser, hasActivePlan]);

  const currentPlanDuration = useMemo(() => {
    if (!currentPlan) return "-";
    const normalizedCurrentPlanName = currentPlan.name.trim().toLowerCase();
    const latestMatchingInvoice =
      userInvoices.find((invoice) => {
        const invoicePlanName = invoice.plan?.name?.trim().toLowerCase() ?? "";
        if (!invoicePlanName) return false;
        // Stripe line items can include prefixes like "1 × ...", so match by containment too.
        return (
          invoicePlanName === normalizedCurrentPlanName ||
          invoicePlanName.includes(normalizedCurrentPlanName)
        );
      }) ??
      userInvoices.find(
        (invoice) => !!invoice.periodStart || !!invoice.periodEnd,
      );

    if (!latestMatchingInvoice) return "-";
    const start = formatShortDate(latestMatchingInvoice.periodStart);
    const end = formatShortDate(latestMatchingInvoice.periodEnd);
    if (start === "-" && end === "-") return "-";
    if (start !== "-" && end === "-") return start;
    if (start === "-" && end !== "-") return end;
    return `${start} - ${end}`;
  }, [currentPlan, userInvoices]);

  const relatedUsers = useMemo(() => {
    if (!selectedUser) return [];
    return users.filter(
      (user) =>
        user.created_by_user_id === selectedUser.id && user.id !== selectedUser.id,
    );
  }, [users, selectedUser]);
  const staffUsers = useMemo(
    () => relatedUsers.filter((user) => user.role !== "client"),
    [relatedUsers],
  );
  const customerUsers = useMemo(
    () => relatedUsers.filter((user) => user.role === "client"),
    [relatedUsers],
  );
  const visibleRelatedUsers = activeUserTab === "staff" ? staffUsers : customerUsers;
  const showAdminSections = selectedUser?.role === "admin";

  useEffect(() => {
    setActiveUserTab("staff");
  }, [selectedUser?.id]);

  const deleteUser = async () => {
    if (!selectedUser) return;
    const confirmed = window.confirm(`Delete user ${selectedUser.email}?`);
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/superadmin/users/${selectedUser.id}`, {
        method: "DELETE",
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to delete user");
      }
      router.push("/users");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const cancelSubscription = async () => {
    if (!selectedUser) return;
    const confirmed = window.confirm(
      `Cancel subscription for ${selectedUser.email} at period end?`,
    );
    if (!confirmed) return;

    setCancelingSubscription(true);
    setError(null);
    setCancelSubscriptionMessage(null);
    try {
      const res = await fetch(
        `/api/superadmin/users/${selectedUser.id}/subscription/cancel`,
        {
          method: "POST",
        },
      );
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to cancel subscription");
      }
      const effectiveAt = payload?.effectiveAt ? formatShortDate(payload.effectiveAt) : null;
      setCancelSubscriptionMessage(
        effectiveAt
          ? `Cancellation scheduled for ${effectiveAt}.`
          : payload?.message || "Cancellation scheduled.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel subscription");
    } finally {
      setCancelingSubscription(false);
    }
  };

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
        prev.map((row) =>
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
                      address_line_1: editingUser.account_address_line_1 || null,
                      address_line_2: editingUser.account_address_line_2 || null,
                      city: editingUser.account_city || null,
                      state: editingUser.account_state || null,
                      zip_code: editingUser.account_zip_code || null,
                      country: editingUser.account_country || null,
                      status: editingUser.account_status || null,
                    }
                  : null,
              }
            : row,
        ),
      );

      setEditingUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setSavingUserId(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-gray-600">Loading user details...</div>;
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <button
          onClick={() => router.push("/users")}
          className="inline-flex items-center gap-2 text-sm text-primary"
        >
          <ChevronLeft size={16} /> Back to users
        </button>
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!selectedUser) {
    return (
      <div className="p-6 space-y-4">
        <button
          onClick={() => router.push("/users")}
          className="inline-flex items-center gap-2 text-sm text-primary"
        >
          <ChevronLeft size={16} /> Back to users
        </button>
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          User not found.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push("/users")}
          className="w-10 h-10 flex items-center justify-center bg-white border rounded-xl"
        >
          <ChevronLeft />
        </button>
        <h1 className="text-2xl font-semibold text-primary">Details</h1>
      </div>

      <div className="border bg-white rounded-xl p-4">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div className="flex gap-3 items-center">
            <div className="w-[70px] h-[70px] rounded-full flex items-center justify-center bg-primary text-white text-2xl font-medium">
              {getInitials(selectedUser.name, selectedUser.email)}
            </div>
            <div>
              <h4 className="text-lg font-bold">{selectedUser.name || "Unnamed"}</h4>
              <p className="text-sm font-medium text-gray-500">
                Role : {formatRoleLabel(selectedUser.role)}
              </p>
              <p className="text-sm font-medium text-gray-500">Email : {selectedUser.email}</p>
              <p className="text-sm font-medium text-gray-500">
                Account : {selectedUser.account?.name || selectedUser.account_id || "-"}
              </p>
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-3 text-right">
              Created: {formatDate(selectedUser.created_at)}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingUser(toEditableUser(selectedUser))}
                className="px-3 py-1.5 rounded-md bg-primary text-white flex gap-3 items-center justify-center w-[130px]"
              >
                <SquarePen size={18} /> Edit
              </button>
              <button
                onClick={deleteUser}
                disabled={deleting}
                className="px-3 py-1.5 rounded-md bg-red-600 text-white disabled:opacity-50 flex gap-3 items-center justify-center w-[130px]"
              >
                <Trash2 size={18} /> {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAdminSections && (
        <>
          <div>
            <h3 className="text-xl font-semibold mb-3">Your Current Subscription Plan</h3>
            <div className="border bg-white rounded-xl p-4 mt-2">
              {currentPlan ? (
                <div className="flex justify-between items-center gap-4">
                  <div className="flex gap-3 items-center">
                    <div className="w-[70px] h-[70px] rounded-full flex items-center justify-center bg-primary text-white text-2xl font-medium">
                      <Crown size={35} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{currentPlan.name}</h3>
                      <p className="mt-2 flex items-baseline gap-x-2">
                        <span className="text-2xl font-bold">
                          {formatCurrency(currentPlan.price, "USD")}
                        </span>
                        <span className="text-sm">/{currentPlan.interval || "month"}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span
                      className={`inline-flex rounded-full px-[24px] py-1.5 text-sm font-medium ${
                        (currentPlan.status ?? "active") === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {(currentPlan.status ?? "active") === "active" ? "Active" : "Inactive"}
                    </span>
                    <p className="text-sm font-medium text-gray-500 mt-3">
                      Duration : {currentPlanDuration}
                    </p>
                    <button
                      onClick={cancelSubscription}
                      disabled={cancelingSubscription}
                      className="mt-3 px-3 py-1.5 rounded-md bg-red-600 text-white disabled:opacity-50"
                    >
                      {cancelingSubscription ? "Canceling..." : "Cancel Subscription"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No active plan found.</div>
              )}
              {cancelSubscriptionMessage && (
                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  {cancelSubscriptionMessage}
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Billing History</h3>
            {hasActivePlan ? (
              <div className="bg-white border rounded-xl overflow-x-auto">
                <table className="w-full min-w-[980px] text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium text-gray-600">Plan Name</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Price</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Payment Date</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Renewal Date</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userInvoices.length === 0 && (
                      <tr className="border-t">
                        <td className="px-4 py-3 text-gray-500" colSpan={6}>
                          No billing history found.
                        </td>
                      </tr>
                    )}
                    {userInvoices.map((invoice) => {
                      const invoiceStatus = invoice.status.toLowerCase();
                      const isPaid = invoiceStatus === "paid";
                      const downloadLink = invoice.receiptUrl || invoice.downloadUrl;
                      return (
                        <tr key={invoice.id} className="border-t">
                          <td className="px-4 py-3 align-middle">
                            <div className="font-medium text-gray-900">{invoice.plan.name || "-"}</div>
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <p className="flex items-baseline gap-x-2">
                              <span className="text-sm font-bold">
                                {formatCurrency(invoice.plan.amount, invoice.currency)}
                              </span>
                              <span className="text-sm">/{invoice.plan.interval || "month"}</span>
                            </p>
                          </td>
                          <td className="px-4 py-3 align-middle">{formatShortDate(invoice.createdAt)}</td>
                          <td className="px-4 py-3 align-middle text-gray-600">
                            {formatShortDate(invoice.periodEnd)}
                          </td>
                          <td className="px-4 py-3 align-middle text-gray-600">
                            <span
                              className={`inline-flex rounded-lg px-[24px] py-1.5 text-sm font-medium ${
                                isPaid ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {isPaid ? "Paid" : invoice.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 align-middle w-[208px]">
                            {downloadLink ? (
                              <a href={downloadLink} target="_blank" rel="noreferrer">
                                <button className="px-3 py-1.5 rounded-md bg-primary text-white flex gap-3 items-center justify-center w-[130px]">
                                  <DownloadIcon size={18} /> Download
                                </button>
                              </a>
                            ) : (
                              <button className="px-3 py-1.5 rounded-md bg-gray-200 text-gray-500 flex gap-3 items-center justify-center w-[130px]" disabled>
                                <DownloadIcon size={18} /> Not ready
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-gray-500 border bg-white rounded-xl p-4">
                No billing history found because this user has no active plan.
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">List of users</h3>
            <div className="mb-3 flex items-center gap-2">
              <button
                onClick={() => setActiveUserTab("staff")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  activeUserTab === "staff"
                    ? "bg-primary text-white"
                    : "border border-gray-300 bg-white text-gray-700"
                }`}
              >
                Staff Management
              </button>
              <button
                onClick={() => setActiveUserTab("customer")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  activeUserTab === "customer"
                    ? "bg-primary text-white"
                    : "border border-gray-300 bg-white text-gray-700"
                }`}
              >
                Customer Management
              </button>
            </div>
            <div className="bg-white border rounded-xl overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-600">User</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Role</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Account</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Last Login</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRelatedUsers.length === 0 && (
                    <tr className="border-t">
                      <td className="px-4 py-3 text-gray-500" colSpan={6}>
                        {activeUserTab === "staff"
                          ? "No staff users created by this admin."
                          : "No customer users created by this admin."}
                      </td>
                    </tr>
                  )}
                  {visibleRelatedUsers.map((user) => (
                    <tr key={user.id} className="border-t">
                      <td className="px-4 py-3 align-top">
                        <div className="font-medium text-gray-900">{user.name || "Unnamed"}</div>
                        <div className="text-gray-600">{user.email}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Created: {formatDate(user.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">{formatRoleLabel(user.role)}</td>
                      <td className="px-4 py-3 align-top">{user.status}</td>
                      <td className="px-4 py-3 align-top text-gray-600">
                        {user.account?.name || user.account_id || "-"}
                      </td>
                      <td className="px-4 py-3 align-top text-gray-600">{formatDate(user.last_login_at)}</td>
                      <td className="px-4 py-3 align-top w-[208px]">
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/users/${user.id}`)}
                            className="px-3 py-1.5 rounded-md border border-primary text-primary flex gap-2 items-center justify-center w-[100px]"
                          >
                            <Eye size={16} /> View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

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
                    {formatRoleLabel(role)}
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
