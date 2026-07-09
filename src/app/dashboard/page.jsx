import DashboardContent from "./components/DashboardContent";
import { API_URL } from "@/utils/constants";
import { serverApiGet } from "@/lib/server-api";

export default async function DashboardPage() {
  const [slaResponse, countsResponse, discrepancyTypesResponse, carrierOnTimeResponse] = await Promise.all([
    serverApiGet(API_URL.ORDERS_SLA, { params: { page: 1, limit: 5 } }),
    serverApiGet(API_URL.DASHBOARD_COUNTS),
    serverApiGet(API_URL.DASHBOARD_DISCREPANCY_TYPES),
    serverApiGet(API_URL.DASHBOARD_CARRIER_ON_TIME_RATE),
  ]);

  return (
    <DashboardContent
      initialSlaDashboard={slaResponse}
      initialCounts={countsResponse?.data}
      initialDiscrepancyTypes={discrepancyTypesResponse?.data}
      initialCarrierOnTimeRate={carrierOnTimeResponse?.data}
    />
  );
}
