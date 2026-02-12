"use client";

import { useEffect, useState, useCallback } from "react";
import { useSupabase } from "@/components/supabase-provider";
import {
  ShoppingBag,
  DollarSignIcon,
  PackageCheck,
  Settings2,
  Crown,
} from "lucide-react";
import { DashboardCard } from "@/types/dashboard";
import ShippedOrdersChart from "@/components/dashboard/ShippedOrdersChart";
import NewOrdersChart from "@/components/dashboard/NewOrderChart";
import { useDashboardPreferences } from "@/hooks/useDashboardPreferences";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { DateRange } from "react-day-picker";
import { startOfMonth, endOfMonth } from "date-fns";
import "@/styles/daypicker-custom.css";
import DashboardGrid from "@/components/dashboard/DashboardGrid";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import DashboardBuilder from "@/components/dashboard/DashboardBuilder";
import SalesVsPreviousMonthChart from "@/components/dashboard/SalesVsPreviousMonthChart";
import SalesByMarketplaceChart from "@/components/dashboard/SalesByMarketplaceChart";
import OrdersPerDayChart from "@/components/dashboard/OrdersPerDayChart";
import LowStockAlertChart from "@/components/dashboard/LowStockAlertChart";
import ReorderForecastChart from "@/components/dashboard/ReorderForecastChart";
import TopSellingProductsChart from "@/components/dashboard/TopSellingProductsChart";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

export default function DashboardClient({ userId }: { userId: string }) {
  const supabase = useSupabase();
  const searchParams = useSearchParams();

  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const [orders, setOrders] = useState<any[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [startDate, setStartDate] = useState(
    () => startOfMonth(new Date()).toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    () => endOfMonth(new Date()).toISOString().split("T")[0],
  );
  // ✅ PLAN STATE
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const {
    cardsOrder = [],
    visibleCards = [],
    saveOrder,
    toggleCard,
    resetLayout,
    reloadPreferences,
    loading,
  } = useDashboardPreferences(userId);

  const [openBuilder, setOpenBuilder] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const showCheckoutBanner = searchParams.get("checkout") === "success";

  const fetchInvoice = useCallback(async () => {
    const checkout = searchParams.get("checkout");
    const sessionId = searchParams.get("session_id");
    if (checkout !== "success" || !sessionId) return;

    setInvoiceLoading(true);
    setInvoiceError(null);

    try {
      const res = await fetch(
        `/api/stripe/invoice?session_id=${encodeURIComponent(sessionId)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to load invoice");
      }
      const url = data?.invoice_pdf || data?.invoice_url;
      if (!url) {
        throw new Error("Invoice not available yet");
      }
      setInvoiceUrl(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setInvoiceError(message);
    } finally {
      setInvoiceLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  useEffect(() => {
    async function fetchData() {
      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .select("account_id, role, plan_id")
        .eq("id", userId)
        .maybeSingle();

      if (userError || !userRecord) {
        console.error("❌ Error fetching user info:", userError?.message);
        return;
      }

      const userRole = userRecord.role;
      setUserRole(userRole);
      // ✅ FETCH PLAN DETAILS
      if (userRecord.plan_id) {
        const { data: planData } = await supabase
          .from("plans")
          .select("*")
          .eq("id", userRecord.plan_id)
          .single();

        if (planData) {
          setSelectedPlan(planData);
        }
      }

      const userAccountId = userRecord.account_id;

      if (!userAccountId) {
        setAccountId(null);
        setOrders([]);
        return;
      }

      setAccountId(userAccountId);

      let query = supabase
        .from("sellercloud_orders")
        .select("*")
        .gte("order_date", startDate)
        .lte("order_date", endDate);

      if (userRole === "client" || userRole === "staff-client") {
        query = query.eq("channel_account_id", userAccountId);
      } else {
        query = query.eq("account_id", userAccountId);
      }

      const PAGE_SIZE = 1000;
      let from = 0;
      const allOrders: any[] = [];

      while (true) {
        const { data, error } = await query.range(from, from + PAGE_SIZE - 1);

        if (error) {
          console.error("❌ Error fetching orders (paginated):", error.message);
          return;
        }

        if (!data || data.length === 0) {
          break;
        }

        allOrders.push(...data);

        if (data.length < PAGE_SIZE) {
          // última página
          break;
        }

        from += PAGE_SIZE;
      }

      setOrders(allOrders);
    }

    fetchData();
  }, [userId, supabase, startDate, endDate]);

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.grand_total || 0), 0);
  const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const ordersInTransit = orders.filter(
    (o) => o.order_status?.toLowerCase() === "shipped",
  ).length;
  const returns = orders.filter(
    (o) => o.order_status?.toLowerCase() === "cancelled",
  ).length;
  const pendingOrders = orders.filter((o) =>
    ["pending", "processing"].includes(o.order_status?.toLowerCase()),
  ).length;

  const dashboardCards: DashboardCard[] = [
    {
      id: "total_orders",
      label: (
        <div className="flex items-center gap-3">
          <ShoppingBag />
          <div>
            <p className="text-xs text-gray-500">Orders</p>
            <p className="text-xl font-bold text-[#3f2d90]">{totalOrders}</p>
          </div>
        </div>
      ),
      type: "kpi",
    },
    {
      id: "total_sales",
      label: (
        <div className="flex items-center gap-3">
          <DollarSignIcon />
          <div>
            <p className="text-xs text-gray-500">Sales</p>
            <p className="text-xl font-bold text-primary">
              {totalRevenue.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
            </p>
          </div>
        </div>
      ),
      type: "kpi",
    },
    {
      id: "average_ticket",
      label: (
        <div className="flex items-center gap-3">
          <DollarSignIcon />
          <div>
            <p className="text-xs text-gray-500">Average Ticket</p>
            <p className="text-xl font-bold text-primary">
              {averageTicket.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
            </p>
          </div>
        </div>
      ),
      type: "kpi",
    },
    {
      id: "orders_shipped",
      label: (
        <div className="flex items-center gap-3">
          <PackageCheck />
          <div>
            <p className="text-xs text-gray-500">Orders closed</p>
            <p className="text-xl font-bold text-[#3f2d90]">
              {ordersInTransit}
            </p>
          </div>
        </div>
      ),
      type: "kpi",
    },
    {
      id: "returns",
      label: (
        <div className="flex items-center gap-3">
          <PackageCheck />
          <div>
            <p className="text-xs text-gray-500">Returns</p>
            <p className="text-xl font-bold text-red-500">{returns}</p>
          </div>
        </div>
      ),
      type: "kpi",
    },
    {
      id: "pending_orders",
      label: (
        <div className="flex items-center gap-3">
          <PackageCheck />
          <div>
            <p className="text-xs text-gray-500">Pending Orders</p>
            <p className="text-xl font-bold text-yellow-500">{pendingOrders}</p>
          </div>
        </div>
      ),
      type: "kpi",
    },
    {
      id: "new_orders_chart",
      label:
        userRole && accountId ? (
          <div key={`new-orders-${Math.random()}`}>
            <NewOrdersChart userRole={userRole} userAccountId={accountId} />
          </div>
        ) : null,
      type: "chart",
    },
    {
      id: "shipped_orders_chart",
      label:
        userRole && accountId ? (
          <div key={`shipped-orders-${Math.random()}`}>
            <ShippedOrdersChart userRole={userRole} userAccountId={accountId} />
          </div>
        ) : null,
      type: "chart",
    },
    {
      id: "sales_vs_previous_month_chart",
      label:
        userRole && accountId ? (
          <div key={`sales-vs-previous-${Math.random()}`}>
            <SalesVsPreviousMonthChart
              userRole={userRole}
              userAccountId={accountId}
            />
          </div>
        ) : null,
      type: "chart",
    },
    {
      id: "sales_by_marketplace_chart",
      label:
        userRole && accountId ? (
          <div key={`sales-by-marketplace-${Math.random()}`}>
            <SalesByMarketplaceChart
              userRole={userRole}
              userAccountId={accountId}
            />
          </div>
        ) : null,
      type: "chart",
    },
    {
      id: "orders_per_day_chart",
      label:
        userRole && accountId ? (
          <div key={`orders-per-day-${Math.random()}`}>
            <OrdersPerDayChart userRole={userRole} userAccountId={accountId} />
          </div>
        ) : null,
      type: "chart",
    },
    {
      id: "top_selling_products_chart",
      label: accountId ? (
        <TopSellingProductsChart accountId={accountId} />
      ) : null,
      type: "chart",
    },
  ];

  const displayedCards = (
    cardsOrder.length > 0 ? cardsOrder : dashboardCards.map((card) => card.id)
  ).filter((id) => visibleCards.includes(id));

  return (
    <div className="p-6 space-y-6">
      {showCheckoutBanner && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-indigo-900">
              Subscription activated
            </p>
            <p className="text-sm text-indigo-800/80">
              {invoiceLoading
                ? "Preparing your invoice..."
                : invoiceUrl
                  ? "Your invoice is ready to download."
                  : invoiceError || "Invoice is not ready yet."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {invoiceUrl && (
              <Button asChild>
                <a href={invoiceUrl} target="_blank" rel="noreferrer">
                  Download invoice
                </a>
              </Button>
            )}
            {!invoiceUrl && (
              <Button
                variant="outline"
                onClick={fetchInvoice}
                disabled={invoiceLoading}
              >
                {invoiceLoading ? "Checking..." : "Try again"}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ✅ PLAN DISPLAY */}

      {selectedPlan && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-6 rounded-2xl shadow-xl flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Crown className="w-8 h-8" />
            <div>
              <p className="text-sm opacity-80">Your Current Plan</p>
              <h2 className="text-2xl font-bold">{selectedPlan.name}</h2>
              <p className="text-sm">${selectedPlan.price} / monthly</p>
            </div>
          </div>

          <Button
            onClick={() => (window.location.href = "/billing/pricing")}
            className="bg-white text-indigo-700 hover:bg-gray-100"
          >
            Change Plan
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2 mb-4">
          <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
          <div className="max-w-full">
            <DateRangePicker
              date={selectedRange}
              setDate={(range) => {
                setSelectedRange(range);
                setStartDate(range?.from?.toISOString().slice(0, 10) || "");
                setEndDate(range?.to?.toISOString().slice(0, 10) || "");
              }}
            />
          </div>
        </div>

        <Sheet
          open={openBuilder}
          onOpenChange={(open) => {
            setOpenBuilder(open);
            if (!open) reloadPreferences();
          }}
        >
          <SheetTrigger asChild>
            <Button variant="outline" className="text-sm">
              <Settings2 className="w-4 h-4 mr-2" />
              Customize
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[90vw] sm:w-[600px] overflow-y-auto p-6"
          >
            <DashboardBuilder userId={userId} />
          </SheetContent>
        </Sheet>
      </div>

      <DashboardGrid
        cards={dashboardCards.filter((card) => visibleCards.includes(card.id))}
        order={displayedCards}
        onDragEnd={(newOrder) => saveOrder(newOrder)}
      />
    </div>
  );
}
