import { API_URL } from "@/utils/constants"
import fetchJson from "@/config/fetcher";
import SubscriptionComponent from "./components";

async function fetchPlans(frequency = "month") {
    try {
        const response = await fetchJson(`${API_URL.PLANS}?frequency=${frequency}`)

        return Array.isArray(response?.data) ? response.data : []
    } catch {
        return []
    }
}

export default async function SubscriptionPage() {
    const plans = await fetchPlans("month")

    return <SubscriptionComponent initialPlans={plans} />
}
