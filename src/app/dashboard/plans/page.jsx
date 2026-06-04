"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Edit, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PROJECT_URL } from "@/utils/constants";
import { FetchPlansAction } from "@/services/actions/plans";
import PlanOperation from "./components/operation";

const getUserRole = (user) => {
    const details = user?.data?.user || user?.data || user;
    return details?.role || details?.userType || details?.profile?.role || details?.profile?.userType || details?.clientProfile?.role || null;
};
const isSuperAdmin = (user) => getUserRole(user) == "super_admin";

const formatAmount = (amount, currency) => {
    const value = Number(amount || 0);
    const currencyCode = (currency || "usd").toUpperCase();

    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currencyCode,
            maximumFractionDigits: value % 1 == 0 ? 0 : 2
        }).format(value);
    } catch {
        return `${value} ${currencyCode}`;
    }
};

export default function PlansPage() {
    const dispatch = useDispatch();
    const router = useRouter();
    const { user, loading: userLoading } = useSelector((state) => state.authorization);
    const { data: plans, loading } = useSelector((state) => state.plans);
    const [operation, setOperation] = useState({ show: false, details: null });

    const authorized = isSuperAdmin(user);

    useEffect(() => {
        if (userLoading || !user) return;
        if (!authorized) {
            router.replace(PROJECT_URL.DASHBOARD);
        }
    }, [authorized, router, user, userLoading]);

    useEffect(() => {
        if (authorized) {
            dispatch(FetchPlansAction());
        }
    }, [authorized, dispatch]);

    const stats = useMemo(() => {
        const active = plans?.filter((plan) => plan.status == "active").length || 0;
        const highlighted = plans?.filter((plan) => plan.highlighted).length || 0;

        return { total: plans?.length || 0, active, inactive: Math.max((plans?.length || 0) - active, 0), highlighted };
    }, [plans]);

    if (userLoading || !user || !authorized) {
        return (
            <div className="p-6">
                <Card className="bg-white p-6 text-sm text-muted-foreground">Loading plans...</Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-primary">Plan Management</h1>
                    <p>Create, update, and review subscription plans.</p>
                </div>
                <Button size="lg" onClick={() => setOperation({ show: true, details: null })}>
                    <Plus />
                    Add Plan
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="mb-5 text-[18px] font-medium text-[#4B5A8A]">Total Plans</div>
                    <h2 className="text-4xl font-bold leading-none text-black">{stats.total}</h2>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="mb-5 text-[18px] font-medium text-[#4B5A8A]">Active</div>
                    <h2 className="text-4xl font-bold leading-none text-green-500">{stats.active}</h2>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="mb-5 text-[18px] font-medium text-[#4B5A8A]">Inactive</div>
                    <h2 className="text-4xl font-bold leading-none text-red-500">{stats.inactive}</h2>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="mb-5 text-[18px] font-medium text-[#4B5A8A]">Highlighted</div>
                    <h2 className="text-4xl font-bold leading-none text-violet-600">{stats.highlighted}</h2>
                </div>
            </div>

            <Card className="bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                    <div className="text-lg font-medium">All Plans</div>
                    <div className="text-sm text-muted-foreground">{plans?.length || 0} plans</div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-muted-foreground">
                            <tr className="border-b text-left">
                                <th className="py-2 pr-3">Plan</th>
                                <th className="py-2 pr-3">Prices</th>
                                <th className="py-2 pr-3">Features</th>
                                <th className="py-2 pr-3">Highlighted</th>
                                <th className="py-2 pr-3">Status</th>
                                <th className="py-2 pr-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td className="py-6 text-center text-muted-foreground" colSpan={6}>Loading plans...</td>
                                </tr>
                            )}

                            {!loading && !plans?.length && (
                                <tr>
                                    <td className="py-6 text-center text-muted-foreground" colSpan={6}>No plans found.</td>
                                </tr>
                            )}

                            {!loading && plans?.map((plan) => (
                                <tr key={plan.id} className="border-b last:border-0">
                                    <td className="max-w-72 py-3 pr-3">
                                        <div className="font-medium text-slate-950">{plan.name || "-"}</div>
                                        <div className="line-clamp-2 text-sm text-muted-foreground">{plan.description || "-"}</div>
                                        {plan.slug && <div className="mt-1 text-xs text-muted-foreground">{plan.slug}</div>}
                                    </td>
                                    <td className="py-3 pr-3">
                                        <div className="flex flex-wrap gap-2">
                                            {plan.prices?.map((price) => (
                                                <span key={price.id || price.priceId || price.interval} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                                    {price.amount > 0 ? formatAmount(price.amount, price.currency) : 'Custom'} {price.amount > 0 ? `/${price.interval}` : 'price'}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="max-w-80 py-3 pr-3">
                                        <div className="line-clamp-2 text-muted-foreground">
                                            {Array.isArray(plan.features) && plan.features.length ? plan.features.join(", ") : "-"}
                                        </div>
                                    </td>
                                    <td className="py-3 pr-3">
                                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${plan.highlighted ? "bg-violet-50 text-violet-700 inset-ring inset-ring-violet-600/10" : "bg-slate-100 text-slate-600 inset-ring inset-ring-slate-500/10"}`}>
                                            {plan.highlighted ? "Yes" : "No"}
                                        </span>
                                    </td>
                                    <td className="py-3 pr-3">
                                        <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${plan.status == "active" ? "bg-green-50 text-green-700 inset-ring inset-ring-green-600/10" : "bg-slate-100 text-slate-600 inset-ring inset-ring-slate-500/10"}`}>
                                            {plan.status || "inactive"}
                                        </span>
                                    </td>
                                    <td className="py-3 pr-3">
                                        <Button variant="outline" size="icon" onClick={() => setOperation({ show: true, details: plan })}>
                                            <Edit />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {operation.show && (
                <PlanOperation
                    open={operation.show}
                    details={operation.details}
                    handleClose={() => setOperation({ show: false, details: null })}
                />
            )}
        </div>
    );
}
