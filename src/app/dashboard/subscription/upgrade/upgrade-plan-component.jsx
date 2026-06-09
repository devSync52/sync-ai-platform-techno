"use client"

import { useMemo, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Loader2, RefreshCw, ShieldCheck, Sparkles } from "lucide-react"
import { toast } from "react-hot-toast"
import axiosInstance from "@/config/axios"
import { Button } from "@/components/ui/button"
import { API_URL, PROJECT_URL } from "@/utils/constants"
import { USER_LOGIN_CONSTANTS } from "@/services/constants/authorization"

const billingOptions = [
    { label: "Monthly", value: "month" },
    { label: "Yearly", value: "year" },
]

const getActiveSubscription = (user) => {
    if (!user) return null
    if (user.subscription && typeof user.subscription === "object") return user.subscription

    const subscriptions = Array.isArray(user.subscriptions)
        ? user.subscriptions
        : Array.isArray(user.subscriptionHistory)
            ? user.subscriptionHistory
            : []

    return subscriptions.find((item) => item.status?.toLowerCase() === "active") || subscriptions[0] || null
}

const formatPlanPrice = (plan) => {
    if (plan?.amount == 0) return "Custom"

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: plan?.currency || "usd",
        maximumFractionDigits: Number.isInteger(plan?.amount) ? 0 : 2,
    }).format(plan?.amount || 0)
}

const getPlanPeriod = (plan) => {
    if (plan?.amount == 0) return "pricing"
    return plan?.interval == "year" ? "/year" : "/month"
}

const getDefaultPlanId = (plans, currentPriceId) => {
    const upgradePlan = plans.find((plan) => plan.priceId && plan.priceId !== currentPriceId)
    return upgradePlan?.id || plans[0]?.id || null
}

export default function UpgradePlanComponent({ initialPlans = [] }) {
    const router = useRouter()
    const dispatch = useDispatch()
    const { user } = useSelector((state) => state.authorization)
    const subscription = getActiveSubscription(user)
    const currentPriceId = subscription?.price?.priceId || subscription?.priceId
    const subscriptionId = subscription?.subscriptionId || subscription?.id

    const [plans, setPlans] = useState(initialPlans)
    const [frequency, setFrequency] = useState("month")
    const [selectedPlan, setSelectedPlan] = useState(() => getDefaultPlanId(initialPlans, currentPriceId))
    const [plansLoading, setPlansLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const selectedPlanDetails = useMemo(() => plans.find((plan) => plan.id == selectedPlan), [plans, selectedPlan])
    const currentPlanName = subscription?.product?.name || "Current plan"

    const handleFrequencyChange = async (nextFrequency) => {
        if (nextFrequency == frequency) return

        const previousFrequency = frequency
        setFrequency(nextFrequency)
        setPlansLoading(true)

        try {
            const response = await axiosInstance.get(API_URL.PLANS, {
                params: { frequency: nextFrequency },
            })
            const nextPlans = Array.isArray(response.data?.data) ? response.data.data : []

            setPlans(nextPlans)
            setSelectedPlan(getDefaultPlanId(nextPlans, currentPriceId))
        } catch (error) {
            setFrequency(previousFrequency)
            toast.error(error?.response?.data?.message || "Unable to fetch plans", { id: "plans" })
        } finally {
            setPlansLoading(false)
        }
    }

    const handleUpdatePlan = async () => {
        if (!subscriptionId) {
            toast.error("Subscription ID is missing")
            return
        }

        if (!selectedPlanDetails?.priceId) {
            toast.error("Please select a valid plan")
            return
        }

        if (selectedPlanDetails.priceId == currentPriceId) {
            toast.error("This is already your current plan")
            return
        }

        setSubmitting(true)

        try {
            const response = await axiosInstance.put(API_URL.USER_SUBSCRIPTION, {
                subscriptionId,
                priceId: selectedPlanDetails.priceId,
                action: "update",
            })

            if (response?.data) {
                dispatch({
                    type: USER_LOGIN_CONSTANTS.UPDATE_USER,
                    payload: response.data,
                })
            }

            toast.success("Plan updated successfully")
            router.push(PROJECT_URL.DASHBOARD_SUBSCRIPTION)
        } catch (error) {
            toast.error(error?.response?.data?.message || "Unable to update plan")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Button type="button" variant="ghost" onClick={() => router.push(PROJECT_URL.DASHBOARD_SUBSCRIPTION)} className="mb-3 gap-2 px-0 hover:bg-transparent">
                            <ArrowLeft className="size-4" />
                            Back to subscription
                        </Button>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-700">Update Plan</p>
                        <h1 className="mt-2 text-3xl font-bold text-gray-950">Choose a plan for your next billing cycle</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                            Compare available plans, keep your existing subscription active, and move to the package that fits your shipping volume.
                        </p>
                    </div>

                    <div className="inline-grid h-11 w-fit grid-cols-2 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
                        {billingOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleFrequencyChange(option.value)}
                                className={`rounded-md px-5 text-sm font-semibold transition-all ${frequency == option.value ? "bg-linear-to-r from-purple-600 to-violet-600 text-white shadow-sm" : "text-gray-700 hover:bg-gray-50"}`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-6 grid gap-4 lg:grid-cols-3">
                    <div className="rounded-lg border border-purple-100 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
                            <ShieldCheck className="size-5" />
                        </div>
                        <p className="text-sm font-semibold text-gray-950">{currentPlanName}</p>
                        <p className="mt-1 text-sm text-gray-600">Your current active plan stays in place until the update is confirmed.</p>
                    </div>
                    <div className="rounded-lg border border-purple-100 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                            <RefreshCw className="size-5" />
                        </div>
                        <p className="text-sm font-semibold text-gray-950">Flexible billing</p>
                        <p className="mt-1 text-sm text-gray-600">Switch between monthly and yearly options before selecting a plan.</p>
                    </div>
                    <div className="rounded-lg border border-purple-100 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-fuchsia-50 text-fuchsia-700">
                            <Sparkles className="size-5" />
                        </div>
                        <p className="text-sm font-semibold text-gray-950">Plan benefits</p>
                        <p className="mt-1 text-sm text-gray-600">Review features side by side so the upgrade decision is easy to scan.</p>
                    </div>
                </div>

                <div className="grid items-stretch gap-5 xl:grid-cols-3">
                    {plans.map((plan) => {
                        const isSelected = selectedPlan == plan.id
                        const isCurrent = plan.priceId && plan.priceId == currentPriceId
                        const isCustom = plan.amount == 0

                        return (
                            <div key={plan.id} className={`flex h-full flex-col rounded-lg border bg-white shadow-sm transition ${isSelected ? "border-purple-600 ring-2 ring-purple-100" : "border-gray-200 hover:border-purple-200 hover:shadow-md"}`}>
                                <div className={`h-9 rounded-t-lg px-4 py-2 text-center text-xs font-bold uppercase tracking-[0.16em] ${plan.product?.highlighted ? "bg-linear-to-r from-purple-600 to-violet-600 text-white" : isCurrent ? "bg-emerald-50 text-emerald-700" : "bg-gray-50 text-gray-400"}`}>
                                    {isCurrent ? "Current plan" : plan.product?.highlighted ? "Recommended" : "Available"}
                                </div>
                                <div className="flex flex-1 flex-col p-6">
                                    <h2 className="text-xl font-bold text-gray-950">{plan.product?.name || "Plan"}</h2>
                                    <p className="mt-2 min-h-10 text-sm leading-5 text-gray-600">{plan.product?.description || "Plan details for courier operations."}</p>

                                    <div className="mt-6 flex h-12 items-end">
                                        <span className="text-4xl font-bold leading-none text-gray-950">{formatPlanPrice(plan)}</span>
                                        <span className="mb-1 ml-2 text-sm font-medium text-gray-600">{getPlanPeriod(plan)}</span>
                                    </div>

                                    <Button
                                        type="button"
                                        variant={isSelected ? "default" : "outline"}
                                        disabled={isCurrent || isCustom}
                                        onClick={() => setSelectedPlan(plan.id)}
                                        className={`mt-6 h-11 w-full font-semibold ${isSelected ? "bg-linear-to-r from-purple-600 to-violet-600 text-white hover:opacity-90" : ""}`}
                                    >
                                        {isCurrent ? "Current plan" : isSelected ? "Selected" : isCustom ? "Contact sales" : "Select plan"}
                                    </Button>

                                    <div className="mt-6 space-y-3">
                                        {(plan.product?.features || []).map((feature) => (
                                            <div key={feature} className="flex items-start gap-3">
                                                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                                                    <Check className="size-3.5 text-emerald-600" />
                                                </span>
                                                <span className="text-sm leading-5 text-gray-700">{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {!plans.length && (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-sm font-medium text-gray-600">
                        {plansLoading ? "Loading plans..." : "No plans available."}
                    </div>
                )}

                <div className="sticky bottom-4 mt-8 rounded-lg border border-gray-200 bg-white/95 p-4 shadow-xl shadow-purple-950/10 backdrop-blur">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-gray-950">
                                {selectedPlanDetails ? `${selectedPlanDetails.product?.name || "Selected plan"} selected` : "Select a plan to continue"}
                            </p>
                            <p className="mt-1 text-sm text-gray-600">
                                {selectedPlanDetails ? `${formatPlanPrice(selectedPlanDetails)} ${getPlanPeriod(selectedPlanDetails)}` : "Choose a plan above, then confirm the update."}
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button type="button" variant="outline" onClick={() => router.push(PROJECT_URL.DASHBOARD_SUBSCRIPTION)} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button type="button" onClick={handleUpdatePlan} disabled={submitting || plansLoading || !selectedPlanDetails || selectedPlanDetails?.priceId == currentPriceId} className="gap-2 bg-linear-to-r from-purple-600 to-violet-600 px-6 text-white hover:opacity-90">
                                {submitting && <Loader2 className="size-4 animate-spin" />}
                                Update plan
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
