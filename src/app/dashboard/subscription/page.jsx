"use client"

import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "react-hot-toast"
import axiosInstance from "@/config/axios"
import { API_URL, PROJECT_URL } from "@/utils/constants"
import { USER_LOGIN_CONSTANTS } from "@/services/constants/authorization"

const getActiveSubscription = (user) => {
    if (!user) return null
    if (user.subscription && typeof user.subscription === "object") {
        return user.subscription
    }

    const subscriptions = Array.isArray(user.subscriptions)
        ? user.subscriptions
        : Array.isArray(user.subscriptionHistory)
            ? user.subscriptionHistory
            : []

    return subscriptions.find((item) => item.status?.toLowerCase() === "active") || subscriptions[0] || null
}

const getInvoiceList = (user) => {
    if (!user) return []
    return Array.isArray(user.invoices) ? user.invoices : []
}

const formatDate = (value) => {
    if (!value) return "-"
    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value))
}

const formatMoney = (amount, currency = "usd") => {
    if (amount == null) return "-"
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
        maximumFractionDigits: 0,
    }).format(amount)
}

export default function SubscriptionPage() {
    const dispatch = useDispatch()
    const router = useRouter()
    const { user } = useSelector((state) => state.authorization)
    const [loadingItems, setLoadingItems] = useState({})

    const subscription = getActiveSubscription(user)
    const invoices = getInvoiceList(user)
    const hasSubscription = Boolean(subscription)
    const isActive = subscription?.status?.toLowerCase() === "active"
    const price = subscription?.price || {}
    const product = subscription?.product || {}
    const features = product.features || []
    const subscriptionId = subscription?.subscriptionId || subscription?.id

    const updateUser = (payload) => dispatch({ type: USER_LOGIN_CONSTANTS.UPDATE_USER, payload })

    const handleAction = async (currentSubscriptionId, action) => {
        if (!currentSubscriptionId) {
            toast.error("Subscription ID is missing")
            return
        }

        setLoadingItems((state) => ({ ...state, [currentSubscriptionId]: true }))

        try {
            const response = await axiosInstance.put(API_URL.USER_SUBSCRIPTION, {
                subscriptionId: currentSubscriptionId,
                action,
            })

            if (response?.data) {
                updateUser(response.data)
                toast.success(`Subscription ${action === "cancel" ? "cancelled" : "updated"} successfully`)
            } else {
                toast.success(`Subscription ${action === "cancel" ? "cancelled" : "updated"}`)
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || `Unable to ${action} subscription`)
        } finally {
            setLoadingItems((state) => ({ ...state, [currentSubscriptionId]: false }))
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 py-10">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Subscription</p>
                        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Current plan</h1>
                        <p className="mt-1 text-sm text-slate-600">Manage your active subscription and view invoices in one place.</p>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => router.push(PROJECT_URL.SUBSCRIPTION)}>Change plan</Button>
                    </div>
                </div>

                {!hasSubscription ? (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                        <p className="text-sm font-medium text-slate-600">No active subscription found for your account.</p>
                        <p className="mt-3 text-lg font-semibold text-slate-900">Start a new subscription to access premium features.</p>
                        <div className="mt-8 flex justify-center">
                            <Button onClick={() => router.push(PROJECT_URL.SUBSCRIPTION)}>Take Subscription</Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                                <div>
                                    <div className="flex items-center gap-3 text-sm text-slate-500">
                                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">{subscription.status?.toUpperCase() || "ACTIVE"}</span>
                                        <span className="text-slate-400">Started {formatDate(subscription.created)}</span>
                                    </div>
                                    <div className="mt-4">
                                        <h2 className="text-2xl font-semibold text-slate-900">{product.name || "Subscription plan"}</h2>
                                        <p className="mt-2 text-sm text-slate-600">{product.description || "Your active plan details."}</p>
                                    </div>
                                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                        <div className="rounded-3xl bg-slate-50 p-4">
                                            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Price</p>
                                            <p className="mt-2 text-xl font-semibold text-slate-900">{formatMoney(price.amount, price.currency)} <span className="text-sm text-slate-500">/ {price.interval || "month"}</span></p>
                                        </div>
                                        <div className="rounded-3xl bg-slate-50 p-4">
                                            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Billing cycle</p>
                                            <p className="mt-2 font-semibold text-slate-900">{price.interval ? `${price.interval}ly` : "Monthly"}</p>
                                        </div>
                                    </div>

                                    {features.length > 0 && (
                                        <div className="mt-6">
                                            <p className="text-sm font-semibold text-slate-900">Included features</p>
                                            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                                                {features.map((feature) => (
                                                    <li key={feature} className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">{feature}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-3xl bg-slate-50 p-6">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Subscription</p>
                                            <p className="mt-2 font-semibold text-slate-900">{subscriptionId || "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Product ID</p>
                                            <p className="mt-2 font-semibold text-slate-900">{product.productId || product.id || "-"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Price ID</p>
                                            <p className="mt-2 font-semibold text-slate-900">{price.priceId || price.id || "-"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Last updated</p>
                                            <p className="mt-2 font-semibold text-slate-900">{formatDate(price.updatedAt || price.createdAt)}</p>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex flex-wrap gap-3">
                                        <Button
                                            variant={isActive ? "secondary" : "outline"}
                                            disabled={!isActive || loadingItems[subscriptionId]}
                                            onClick={() => handleAction(subscriptionId, "cancel")}
                                        >
                                            {loadingItems[subscriptionId] ? "Processing..." : "Cancel"}
                                        </Button>
                                        <Button
                                            disabled={!isActive || loadingItems[subscriptionId]}
                                            onClick={() => handleAction(subscriptionId, "update")}
                                        >
                                            {loadingItems[subscriptionId] ? "Processing..." : "Update"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Invoice history</p>
                                    <p className="text-sm text-slate-500">Recent invoices for this subscription.</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => router.push(PROJECT_URL.DASHBOARD)}>
                                    View dashboard
                                </Button>
                            </div>

                            {invoices.length === 0 ? (
                                <div className="mt-8 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
                                    No invoices available yet.
                                </div>
                            ) : (
                                <div className="mt-6 overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                        <thead className="bg-slate-100 text-slate-600">
                                            <tr>
                                                <th className="px-4 py-3 font-semibold">Invoice #</th>
                                                <th className="px-4 py-3 font-semibold">Date</th>
                                                <th className="px-4 py-3 font-semibold">Amount</th>
                                                <th className="px-4 py-3 font-semibold">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 bg-white">
                                            {invoices.map((invoice) => (
                                                <tr key={invoice.id || invoice.invoiceNumber || invoice.invoiceId}>
                                                    <td className="px-4 py-4 text-slate-700">{invoice.invoiceNumber || invoice.invoiceId || invoice.id || "—"}</td>
                                                    <td className="px-4 py-4 text-slate-500">{formatDate(invoice.date || invoice.createdAt || invoice.updatedAt)}</td>
                                                    <td className="px-4 py-4 text-slate-700">{formatMoney(invoice.amount, invoice.currency)}</td>
                                                    <td className="px-4 py-4 text-slate-700">{(invoice.status || "Paid").toUpperCase()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
