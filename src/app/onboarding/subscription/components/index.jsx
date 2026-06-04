"use client"

import { useMemo, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Check, LogOut } from "lucide-react"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import axiosInstance from "@/config/axios"
import { UserLogoutAction } from "@/services/actions/authorization"
import { USER_LOGIN_CONSTANTS } from "@/services/constants/authorization"
import { API_URL, PROJECT_URL } from "@/utils/constants"

const billingOptions = [
    {
        label: "Monthly",
        value: "month"
    },
    {
        label: "Yearly",
        value: "year"
    },
]

const getDefaultPlanId = (plans) => plans.find((plan) => plan.product?.highlighted)?.id || plans[0]?.id || null

const formatPlanPrice = (plan) => {
    if (plan?.amount == 0) return "Custom"

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: plan.currency || "usd",
        maximumFractionDigits: Number.isInteger(plan.amount) ? 0 : 2,
    }).format(plan.amount)
}

const getPlanPeriod = (plan) => {
    if (plan?.amount == 0) return "pricing"
    return plan?.interval == "year" ? "/year" : "/month"
}

export default function SubscriptionComponent({ initialPlans = [] }) {
    const { user } = useSelector(state => state.authorization)
    const dispatch = useDispatch()
    const router = useRouter()
    const [plans, setPlans] = useState(initialPlans)
    const [selectedPlan, setSelectedPlan] = useState(() => getDefaultPlanId(initialPlans))
    const [frequency, setFrequency] = useState("month")
    const [plansLoading, setPlansLoading] = useState(false)
    const [loading, setLoading] = useState(false)

    const selectedPlanDetails = useMemo(() => plans.find((plan) => plan.id == selectedPlan), [plans, selectedPlan])

    const handleSelectPlan = (plan) => {
        if (plan.amount == 0) return
        setSelectedPlan(plan.id)
    }

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
            setSelectedPlan(getDefaultPlanId(nextPlans))
        } catch (error) {
            setFrequency(previousFrequency)
            toast.error(error?.response?.data?.message || "Unable to fetch plans", { id: "plans" })
        } finally {
            setPlansLoading(false)
        }
    }

    const handleContinue = async () => {
        if (!selectedPlan) {
            toast.error("Please select a subscription plan")
            return
        }

        setLoading(true)
        try {
            const response = await axiosInstance.put(API_URL.USER_SUBSCRIPTION, {
                subscriptionPlan: selectedPlan,
                subscriptionPriceId: selectedPlanDetails?.priceId,
                billingCycle: frequency,
                onboardingStep: "completed"
            })

            if (response.data.success) {
                dispatch({
                    type: USER_LOGIN_CONSTANTS.UPDATE_USER,
                    payload: response.data.data.user || {
                        ...user,
                        subscriptionPlan: selectedPlan,
                        subscriptionPriceId: selectedPlanDetails?.priceId,
                        billingCycle: frequency,
                        onboardingStep: "completed"
                    }
                })
                toast.success("Subscription plan selected successfully!")
                router.push(PROJECT_URL.DASHBOARD)
            } else {
                toast.error(response.data.message || "Failed to select subscription plan")
            }
        } catch (error) {
            console.error("Subscription error:", error)
            toast.error(error.response?.data?.message || "Failed to select subscription plan")
        } finally {
            setLoading(false)
        }
    }

    const handleSkip = async () => {
        setLoading(true)
        axiosInstance.put(API_URL.USER_COMPLETE_ONBOARDING).then((response) => {
            dispatch({
                type: USER_LOGIN_CONSTANTS.UPDATE_USER,
                payload: response.data
            })
            router.push(PROJECT_URL.DASHBOARD)
        }).catch((error) => {
            toast.error(error.response?.data?.message || "Failed to complete onboarding", { id: "onboarding" })
        }).finally(() => {
            setLoading(false)
        })
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(103,0,231,0.08),transparent_32%),linear-gradient(135deg,#fbfafc_0%,#f6f2fb_46%,#fdfcff_100%)]">
            <div className="px-4 py-8 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-2 flex justify-end">
                        <Button type="button" variant="outline" onClick={() => UserLogoutAction(dispatch)} className="h-10 gap-2 px-4">
                            <LogOut className="size-4" />
                            Logout
                        </Button>
                    </div>

                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center mb-4">
                            <Image src={PROJECT_URL.LOGO} alt="SynC AI" width={72} height={72} />
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Choose Your Plan</h1>
                        <p className="text-lg text-gray-600">Select the perfect plan for your courier management needs</p>
                        <div className="mt-6 inline-grid h-11 grid-cols-2 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
                            {billingOptions.map((option) => (
                                <button key={option.value} type="button" onClick={() => handleFrequencyChange(option.value)} className={`rounded-md px-6 text-sm font-semibold transition-all ${frequency == option.value ? "bg-linear-to-r from-purple-600 to-violet-600 text-white shadow-sm" : "text-gray-700 hover:bg-gray-50"}`}>
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid items-stretch gap-8 mb-8 md:grid-cols-3">
                        {plans.map((plan) => (
                            <div key={plan.id} className={`flex h-full flex-col overflow-hidden rounded-lg bg-white transition-all cursor-pointer ${selectedPlan == plan.id ? "ring-2 ring-purple-600 shadow-xl transform scale-105" : "border border-gray-200 hover:shadow-lg"} ${plan.product?.highlighted ? "md:relative md:scale-105 shadow-xl" : ""}`} onClick={() => handleSelectPlan(plan)}>
                                <div className={`h-10 py-2 px-4 text-center text-sm font-semibold ${plan.product?.highlighted ? "bg-linear-to-r from-purple-600 to-violet-600 text-white" : "bg-transparent text-transparent"}`}>
                                    {plan.product?.highlighted ? "MOST POPULAR" : "Featured"}
                                </div>
                                <div className="flex flex-1 flex-col p-8">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{plan.product?.name || "Plan"}</h2>
                                    <p className="min-h-5 text-gray-600 text-sm mb-6">{plan.product?.description || ""}</p>
                                    <div className="mb-6 flex h-12 items-end">
                                        <span className="text-4xl font-bold leading-none text-gray-900">{formatPlanPrice(plan)}</span>
                                        <span className="text-gray-600 ml-2">{getPlanPeriod(plan)}</span>
                                    </div>

                                    <button type="button" onClick={() => handleSelectPlan(plan.id)} className={`mb-8 flex h-11 w-full items-center justify-center rounded-lg px-4 font-semibold transition-all ${selectedPlan == plan.id ? "bg-linear-to-r from-purple-600 to-violet-600 text-white" : "bg-gray-100 text-gray-900 hover:bg-gray-200"}`}>
                                        {selectedPlan == plan.id ? "Selected" : "Select Plan"}
                                    </button>

                                    <div className="space-y-4">
                                        {(plan.product?.features || []).map((feature) => (
                                            <div key={feature} className="flex items-start gap-3">
                                                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                                <span className="text-gray-700 text-sm">{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {!plans.length && (
                        <div className="mx-auto mb-8 max-w-xl rounded-lg border border-dashed border-gray-300 bg-white/80 px-6 py-10 text-center text-sm font-medium text-gray-600">
                            {plansLoading ? "Loading plans..." : "No plans available."}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                        <Button type="button" variant="outline" onClick={handleSkip} disabled={loading || plansLoading} className="h-11 min-w-36 px-8 font-semibold">
                            Skip For Now
                        </Button>
                        <Button type="button" onClick={handleContinue} disabled={loading || plansLoading || !selectedPlan} className="h-11 min-w-36 px-8 bg-linear-to-r from-purple-600 to-violet-600 hover:opacity-90 text-white font-semibold">
                            {loading ? "Processing..." : "Continue"}
                        </Button>
                    </div>

                    <div className="text-center mt-12">
                        <p className="text-sm text-gray-600">You can change your plan anytime from your account settings</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
