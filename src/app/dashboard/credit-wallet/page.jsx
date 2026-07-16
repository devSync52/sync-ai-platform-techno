import WalletContent from "./WalletContent";
import { API_URL } from "@/utils/constants";
import { serverApiGet } from "@/lib/server-api";

const emptyWallet = {
    summary: { balance: 0, totalLoaded: 0, totalConsumed: 0 },
    consumptionTrend: [],
    transactions: [],
    pagination: { page: 1, rowCount: 10, total: 0, totalPages: 1 },
};

export default async function CreditWalletPage() {
    const response = await serverApiGet(API_URL.WALLET, {
        params: { page: 1, limit: 10 },
    });

    return <WalletContent initialWallet={response?.data || emptyWallet} />;
}
