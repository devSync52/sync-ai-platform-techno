"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import OrderDetailsSc from "@/components/modals/OrderDetailsSc";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import Image from "next/image";
import moment from "moment-timezone";
import SellerCloudOrderProgress, { getSellerCloudStatus } from "./components/sellerCloudOrderProgress";
import TablePagination from "@/components/ui/TablePagination";

import "@/styles/daypicker-custom.css";
import { toast } from "sonner";

function formatOrderTotal(value: unknown): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function OrdersClient({ integrations, warehouses }: { warehouses: any[]; integrations: any[]; }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [viewOperation, setViewOperation] = useState({ show: false, details: null })

  const [searchTerm, setSearchTerm] = useState("");
  const [provider, setProvider] = useState('')
  const [warehouse, setWarehouse] = useState('')

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>({ from: new Date(moment().subtract(30, "days").format()), to: new Date(moment().format()) });

  const chooseProvider = (source: ChangeEvent<HTMLSelectElement>) => {
    setProvider(source.target.value)
    setViewOperation({ show: false, details: null })
  }

  const fetchOrderList = async (page: number = 1, rowsLimit: number = 10, search: string = '', providerId: string = provider, range: DateRange | undefined = selectedRange, warehouseId: string = warehouse,) => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({ page: String(page), pageSize: String(rowsLimit), search: search.trim() });

      if (providerId) params.set('providerId', providerId);
      if (warehouseId) params.set('warehouseId', warehouseId);
      if (range?.from) params.set('startDate', moment(range.from).format("YYYY-MM-DD"));
      if (range?.to) params.set('endDate', moment(range.to).format("YYYY-MM-DD"));

      const response = await fetch(`/api/orders/list?${params.toString()}`, { credentials: "include", cache: "no-store" }).then((res) => res.json()).catch(() => null);

      if (!response) return

      const orders: any[] = Array.isArray(response?.rows) ? response.rows : [];

      setOrders(orders);
      setTotalCount(response?.totalCount ?? 0);
    } catch (error) {
      console.error("❌ Unexpected orders fetch error:", error);
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm("");
    fetchOrderList(1, itemsPerPage, "", provider, selectedRange, warehouse);
  }, [provider, selectedRange, warehouse]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchOrderList(newPage, itemsPerPage, searchTerm, provider, selectedRange, warehouse);
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setItemsPerPage(newRowsPerPage);
    setCurrentPage(1);
    fetchOrderList(1, newRowsPerPage, searchTerm, provider, selectedRange, warehouse);
  };

  const debouncedFetch = useDebounce((value: string) => fetchOrderList(1, itemsPerPage, value, provider, selectedRange, warehouse));

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    debouncedFetch(value);
  };

  const syncOrders = async () => {
    try {
      setIsSyncing(true)
      const response = await fetch("https://euzjrgnyzfgldubqglba.supabase.co/functions/v1/order-syncing-worker", { method: "POST", });
      if (response.ok) {
        toast.success('Order is successfully sync')
      }
      setCurrentPage(1)
      setSearchTerm("")
      fetchOrderList(1, itemsPerPage, "", provider, selectedRange, warehouse)
    } catch (error) {
      console.log(error)
      toast.error('Order is sync process failed')
    } finally {
      setIsSyncing(false)
    }
  };

  const exportOrders = async (filename = "orders.csv") => {
    console.log(filename)
  };

  const resetFilter = () => {
    setSearchTerm("");
    setProvider("");
    setWarehouse("");
    const defaultRange = { from: new Date(moment().subtract(30, "days").format()), to: new Date(moment().format()) };
    setSelectedRange(defaultRange);
    fetchOrderList(1, itemsPerPage, "", "", defaultRange, "");
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-primary">Orders</h1>
        <div className="flex gap-4 items-center">
          <select className="border rounded-md px-2 py-1 text-sm h-9" value={provider} onChange={chooseProvider}>
            <option value={''}>All Source</option>
            {
              integrations.map((integration: any) => (
                <option key={integration?.provider?.id} value={integration?.provider?.id || ''}>
                  {integration?.provider?.name || "Unknown Source"}
                </option>
              ))
            }
          </select>

          <DateRangePicker date={selectedRange} setDate={(range) => setSelectedRange(range ?? undefined)} />

          <Button disabled={isSyncing} onClick={() => syncOrders()}>
            {isSyncing ? "Syncing..." : "Sync Order"}
          </Button>

          <Button variant="outline" disabled={isExporting} onClick={() => exportOrders("orders.csv")}>
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>

          <input
            type="text" value={searchTerm} onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by Order ID, or Marketplace"
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full sm:w-64"
          />

          <select className="border rounded-md px-2 py-1 text-sm h-9" value={warehouse} onChange={(e) => setWarehouse(e.target.value)}>
            <option value="">All warehouses</option>
            {
              warehouses?.map((element) => (
                <option key={element?.warehouse?.id} value={element?.warehouse?.id}>
                  {element?.warehouse?.name}
                </option>
              ))
            }
          </select>

          <Button onClick={resetFilter}>Reset</Button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-sm mt-4">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="py-3 px-4 text-left font-medium">Order ID</th>
              <th className="py-3 px-4 text-left font-medium">Provider</th>
              <th className="py-3 px-4 text-left font-medium">Warehouse</th>
              <th className="py-3 px-4 text-left font-medium">Order Marketplace ID</th>
              <th className="py-3 px-4 text-left font-medium">Order Date</th>
              <th className="py-3 px-4 text-left font-medium">Status</th>
              <th className="py-3 px-4 text-left font-medium">Progress</th>
              <th className="py-3 px-4 text-left font-medium">Total</th>
              <th className="py-3 px-4 text-left font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {
              isLoading ? Array.from({ length: itemsPerPage }).map((_, i) => (
                <tr key={i}>
                  {
                    Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="py-3 px-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: j == 0 ? '80%' : j == 4 ? '90%' : '60%' }} />
                        {j == 0 && <div className="h-3 bg-gray-100 rounded animate-pulse mt-1 w-1/2" />}
                      </td>
                    ))
                  }
                </tr>
              )) : orders.map((element, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-800">
                    {element?.orders?.order_number}
                    <div className="text-xs text-gray-500">
                      {element?.orders?.client_name || "—"}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Image
                        src={element?.orders?.provider?.provider_icon}
                        alt={element?.orders?.provider?.name}
                        width={28} height={28} className="rounded object-contain"
                      />
                      <div className="text-sm text-gray-700">
                        {element?.orders?.provider?.name}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {element?.orders?.warehouse_names || "—"}
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {element?.orders?.order_source_order_id || "—"}
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {element?.orders?.created_at ? moment(element?.orders?.created_at).format("LLLL") : "—"}
                    <div className="text-xs text-gray-400">
                      {element?.orders?.expected_shipping_date ? `Expected Shipping: ${moment(element?.orders?.expected_shipping_date).format("LLLL")}` : ""}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {element?.orders?.provider?.slug == "extensiv" ? (
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium" style={getSellerCloudStatus(element?.orders?.status).style}>
                        {getSellerCloudStatus(element?.orders?.status).name}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium" style={getSellerCloudStatus(element?.orders?.status).style}>
                        {getSellerCloudStatus(element?.orders?.status).name}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {
                      element?.orders?.provider?.slug == "extensiv" ? (
                        <SellerCloudOrderProgress
                          orderStatusCode={element?.orders?.status}
                          paymentStatusCode={element?.orders?.payment_status}
                          shippingStatusCode={element?.orders?.shipment_status}
                        />
                      ) : (
                        <SellerCloudOrderProgress
                          orderStatusCode={element?.orders?.status}
                          paymentStatusCode={element?.orders?.payment_status}
                          shippingStatusCode={element?.orders?.shipment_status}
                        />
                      )
                    }
                  </td>
                  <td className="py-3 px-4 text-gray-800">
                    {element?.orders?.total ? formatOrderTotal(element?.orders?.total) : "—"}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <button onClick={() => setViewOperation({ show: true, details: element?.orders })} className="text-white px-1 py-1 rounded-md text-sm bg-primary hover:bg-primary/90 transition min-w-[80px]">
                      Details
                    </button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>

        <TablePagination
          totalCount={totalCount}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleRowsPerPageChange}
        />
      </div>

      <OrderDetailsSc
        order={selectedOrder}
        open={modalOpen}
        onCloseAction={() => setModalOpen(false)}
      />
    </div>
  );
}
