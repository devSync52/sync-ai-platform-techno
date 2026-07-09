"use client"

import { useCallback, useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useRouter } from "next/navigation"
import { ArrowRight, CalendarClock, Check, CreditCard, Download, FileText, Gauge, LayoutDashboard, Loader2, ReceiptText, ShieldCheck, Sparkles, WalletCards, XCircle } from "lucide-react"
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
    const [invoices, setInvoices] = useState([])
    const [invoicesLoading, setInvoicesLoading] = useState(false)

    const subscription = getActiveSubscription(user)
    const hasSubscription = Boolean(subscription)
    const isActive = subscription?.status?.toLowerCase() === "active"
    const price = subscription?.price || {}
    const product = subscription?.product || {}
    const features = product.features || []
    const subscriptionId = subscription?.subscriptionId || subscription?.id
    const planName = product.name || "Starter"
    const billingCycle = price.interval ? `${price.interval}ly` : "Monthly"
    const supportLabel = features.includes("Email support") ? "Email support included" : "Standard support"
    const statusLabel = subscription?.status?.toUpperCase() || "ACTIVE"
    const detailItems = [
        {
            label: "Status",
            value: statusLabel,
            icon: ShieldCheck,
            tone: "border-emerald-100 bg-emerald-50 text-emerald-700",
        },
        {
            label: "Billing cycle",
            value: billingCycle,
            icon: CalendarClock,
            tone: "border-purple-100 bg-purple-50 text-purple-700",
        },
        {
            label: "Support",
            value: supportLabel,
            icon: Gauge,
            tone: "border-sky-100 bg-sky-50 text-sky-700",
        },
        {
            label: "Started",
            value: formatDate(subscription?.created),
            icon: Sparkles,
            tone: "border-fuchsia-100 bg-fuchsia-50 text-fuchsia-700",
        },
    ]

    const updateUser = (payload) => dispatch({ type: USER_LOGIN_CONSTANTS.UPDATE_USER, payload })

    const fetchInvoices = useCallback(async () => {
        setInvoicesLoading(true)
        try {
            const response = await axiosInstance.get(API_URL.SUBSCRIPTION_INVOICES, {
                params: { page: 1, limit: 10 },
            })
            setInvoices(Array.isArray(response.data?.data) ? response.data.data : [])
        } catch (error) {
            toast.error(error?.response?.data?.message || "Unable to fetch invoices")
        } finally {
            setInvoicesLoading(false)
        }
    }, [])

    useEffect(() => {
        if (!hasSubscription) return

        const timer = window.setTimeout(() => {
            fetchInvoices()
        }, 0)

        return () => {
            window.clearTimeout(timer)
        }
    }, [fetchInvoices, hasSubscription])

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
        <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6 overflow-hidden rounded-lg border border-[#2d2047] bg-[#140821] text-white shadow-xl shadow-purple-950/15">
                    <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_330px] lg:items-end">
                        <div>
                            <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/8 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-purple-100">
                                <WalletCards className="size-4" />
                                Subscription
                            </div>
                            <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
                                Manage your plan, billing, and invoices in one place.
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#cdbfe2] sm:text-base">
                                Keep your courier operations aligned with the right subscription tier and quickly review billing activity without leaving the dashboard.
                            </p>
                        </div>

                        <div className="rounded-lg border border-white/10 bg-white/8 p-5">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a995c9]">Current spend</p>
                            <div className="mt-4 flex items-end gap-2">
                                <span className="text-4xl font-bold">{formatMoney(price.amount, price.currency)}</span>
                                <span className="mb-1 text-sm font-medium text-[#cdbfe2]">/ {price.interval || "month"}</span>
                            </div>
                            <div className="mt-5 flex flex-wrap gap-3">
                                <Button className="gap-2 bg-white text-[#1b0c2b] hover:bg-purple-50" onClick={() => router.push(PROJECT_URL.DASHBOARD_SUBSCRIPTION_UPGRADE)}>
                                    Change plan
                                    <ArrowRight className="size-4" />
                                </Button>
                                <Button variant="outline" className="gap-2 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => router.push(PROJECT_URL.DASHBOARD)}>
                                    <LayoutDashboard className="size-4" />
                                    Dashboard
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {!hasSubscription ? (
                    <div className="rounded-lg border border-dashed border-purple-200 bg-white p-10 text-center shadow-sm">
                        <div className="mx-auto flex size-14 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
                            <CreditCard className="size-7" />
                        </div>
                        <p className="mt-5 text-sm font-bold uppercase tracking-[0.18em] text-purple-700">No subscription</p>
                        <p className="mt-3 text-2xl font-bold text-gray-950">Activate a plan to unlock premium features.</p>
                        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-600">Pick the best plan for your team and start shipping smarter.</p>
                        <div className="mt-8 flex justify-center">
                            <Button className="bg-linear-to-r from-purple-600 to-violet-600 text-white hover:opacity-90" onClick={() => router.push(PROJECT_URL.SUBSCRIPTION)}>
                                Browse plans
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
                            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                                <div className="flex flex-col gap-5 border-b border-gray-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-700">Current plan</p>
                                        <h2 className="mt-2 text-3xl font-bold text-gray-950">{planName}</h2>
                                        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">{product.description || "Your active plan details."}</p>
                                    </div>
                                    <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                                        <span className="size-2 rounded-full bg-emerald-500" />
                                        {statusLabel}
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-lg bg-[#171024] p-6 text-white shadow-sm">
                                        <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-white/10 text-purple-100">
                                            <CreditCard className="size-5" />
                                        </div>
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a995c9]">Plan price</p>
                                        <p className="mt-3 text-4xl font-bold">
                                            {formatMoney(price.amount, price.currency)}
                                            <span className="ml-2 text-base font-medium text-[#cdbfe2]">/ {price.interval || "month"}</span>
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-purple-100 bg-purple-50/70 p-6 shadow-sm">
                                        <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-white text-purple-700">
                                            <CalendarClock className="size-5" />
                                        </div>
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-700">Billing cycle</p>
                                        <p className="mt-3 text-2xl font-bold text-gray-950">{billingCycle}</p>
                                        <p className="mt-2 text-sm leading-6 text-gray-600">Next renewal date is available in billing settings.</p>
                                    </div>
                                </div>

                                {features.length > 0 && (
                                    <div className="mt-6">
                                        <p className="text-sm font-bold text-gray-950">Included benefits</p>
                                        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                                            {features.map((feature) => (
                                                <li key={feature} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                                                    <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                                                        <Check className="size-4" />
                                                    </span>
                                                    <span className="leading-6">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="mt-6 flex flex-wrap gap-3 border-t border-gray-100 pt-6">
                                    <Button
                                        variant={isActive ? "destructive" : "outline"}
                                        disabled={!isActive || loadingItems[subscriptionId]}
                                        onClick={() => handleAction(subscriptionId, "cancel")}
                                        className="gap-2"
                                    >
                                        <XCircle className="size-4" />
                                        {loadingItems[subscriptionId] ? "Processing..." : "Cancel plan"}
                                    </Button>
                                    <Button
                                        variant="default"
                                        disabled={!isActive || loadingItems[subscriptionId]}
                                        onClick={() => router.push(PROJECT_URL.DASHBOARD_SUBSCRIPTION_UPGRADE)}
                                        className="gap-2 bg-linear-to-r from-purple-600 to-violet-600 text-white hover:opacity-90"
                                    >
                                        <Sparkles className="size-4" />
                                        Update plan
                                    </Button>
                                </div>
                            </div>

                            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                                <div className="mb-5 flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-bold text-gray-950">Subscription details</p>
                                        <p className="mt-1 text-sm text-gray-500">Operational billing summary</p>
                                    </div>
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-[#171024] text-white">
                                        <ReceiptText className="size-5" />
                                    </div>
                                </div>
                                <div className="grid gap-3">
                                    {detailItems.map((item) => {
                                        const Icon = item.icon
                                        return (
                                            <div key={item.label} className={`rounded-lg border p-4 ${item.tone}`}>
                                                <div className="flex items-start gap-3">
                                                    <Icon className="mt-0.5 size-5 shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-80">{item.label}</p>
                                                        <p className="mt-1 wrap-break-word text-sm font-bold">{item.value}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-gray-700">
                                        <div className="flex items-start gap-3">
                                            <FileText className="mt-0.5 size-5 shrink-0 text-gray-500" />
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Last updated</p>
                                                <p className="mt-1 text-sm font-bold text-gray-900">{formatDate(price.updatedAt || price.createdAt)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex size-9 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
                                        <FileText className="size-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-950">Invoice history</p>
                                        <p className="text-sm text-gray-500">Review recent billing activity for this subscription.</p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push(PROJECT_URL.DASHBOARD)}>
                                    <LayoutDashboard className="size-4" />
                                    View dashboard
                                </Button>
                            </div>

                            {invoicesLoading ? (
                                <div className="mt-8 flex items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-sm font-semibold text-gray-600">
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Loading invoices
                                </div>
                            ) : invoices.length === 0 ? (
                                <div className="mt-8 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-600">
                                    <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm">
                                        <ReceiptText className="size-5" />
                                    </div>
                                    <p className="font-semibold text-gray-900">No invoices available yet.</p>
                                    <p className="mt-1">Billing records will appear here after your first invoice is generated.</p>
                                </div>
                            ) : (
                                <div className="mt-6 overflow-x-auto rounded-lg border border-gray-100">
                                    <table className="min-w-full text-left text-sm">
                                        <thead className="bg-gray-50 text-gray-600">
                                            <tr>
                                                <th className="px-4 py-3 font-bold">Invoice #</th>
                                                <th className="px-4 py-3 font-bold">Date</th>
                                                <th className="px-4 py-3 font-bold">Amount</th>
                                                <th className="px-4 py-3 font-bold">Status</th>
                                                <th className="px-4 py-3 text-right font-bold">Download</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {invoices.map((invoice) => (
                                                <tr key={invoice.id || invoice.invoiceNumber || invoice.invoiceId}>
                                                    <td className="px-4 py-4 font-semibold text-gray-800">{invoice.invoiceNumber || invoice.stripeInvoiceId || invoice.id || "-"}</td>
                                                    <td className="px-4 py-4 text-gray-500">{formatDate(invoice.paidAt || invoice.createdAt || invoice.updatedAt)}</td>
                                                    <td className="px-4 py-4 font-semibold text-gray-800">{formatMoney(invoice.amount, invoice.currency)}</td>
                                                    <td className="px-4 py-4">
                                                        <span className="inline-flex rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                                            {(invoice.status || "Paid").toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        {invoice.invoicePdf || invoice.hostedInvoiceUrl ? (
                                                            <a href={invoice.invoicePdf || invoice.hostedInvoiceUrl} target="_blank" rel="noreferrer" className="inline-flex h-7 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 text-[0.8rem] font-medium text-gray-700 transition hover:bg-gray-50">
                                                                <Download className="size-4" />
                                                                Download
                                                            </a>
                                                        ) : (
                                                            <span className="text-xs font-semibold text-gray-400">Pending</span>
                                                        )}
                                                    </td>
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
