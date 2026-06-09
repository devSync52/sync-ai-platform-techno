import { API_URL } from "@/utils/constants"
import fetchJson from "@/config/fetcher"
import UpgradePlanComponent from "./upgrade-plan-component"

async function fetchPlans(frequency = "month") {
    try {
        const response = await fetchJson(`${API_URL.PLANS}?frequency=${frequency}`)

        return Array.isArray(response?.data) ? response.data : []
    } catch {
        return []
    }
}

export default async function UpgradePlanPage() {
    const plans = await fetchPlans("month")

    return <UpgradePlanComponent initialPlans={plans} />
}
