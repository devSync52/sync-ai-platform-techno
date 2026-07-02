"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, FileText, PackageCheck, PackagePlus, Pencil, RefreshCw, Trash } from "lucide-react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { Button, buttonVariants } from "@/components/ui/button";
import DashboardPagination from "@/components/DashboardPagination";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { DeleteOrderAction, FetchOrdersAction } from "@/services/actions/orders";
import moment from "moment-timezone";
import { PROJECT_URL } from "@/utils/constants";
import CarrierBrand from "@/components/carrier-brand";

const rowCount = 10;

const formatNumber = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return number % 1 === 0 ? number.toString() : number.toFixed(2).replace(/\.?0+$/, "");
};

const formatCurrency = (amount, currency = "USD", symbol = "$") => {
  const number = Number(amount);
  if (!Number.isFinite(number)) return "-";

  if (currency === "USD") return `${symbol}${number.toFixed(2)}`;
  return `${currency} ${number.toFixed(2)}`;
};

const getPrices = (order) => {
  const prices = Array.isArray(order?.prices) ? order.prices : [];
  const total = prices.reduce((sum, item) => sum + Number(item?.amount || 0), 0);
  const currency = prices[0]?.currency || order?.service?.carrier?.currency?.code || "USD";
  const symbol = order?.service?.carrier?.currency?.symbol || "$";

  return {
    items: prices,
    total: total || Number(order?.bestPrice || order?.best_price || order?.amount || order?.total || order?.charge || 0),
    currency,
    symbol,
  };
};

const getAddressBlock = (address) => {
  if (!address || typeof address == "string") return { title: address || "-", lines: [] };

  const title = address.name || address.company || "-";
  const phone = address.phone || address.mobile_phone || address.mobilePhone;
  const addressLine = address.address || address.addressLine1 || address.address1;
  const addressLine2 = address.addressLine2 || address.address2;
  const province = address.province?.name || address.province?.code || address.province;
  const country = address.region?.name || address.country;
  const location = [address.city, province, address.postalcode || address.postalCode].filter(Boolean).join(" ");

  return {
    title,
    company: address.company,
    phone,
    lines: [addressLine, addressLine2, [location, country].filter(Boolean).join(" ")].filter(Boolean),
  };
};
const getInitiationAddress = (order) => getAddressBlock(order?.initiation || order?.source || order?.from);
const getDestinationAddress = (order) => getAddressBlock(order?.destination || order?.to);

const getPackageDetails = (item = {}) => {
  const inventory = item?.inventory || {};

  return {
    name: inventory.name || item.name || item.productName || item.product_name || "",
    weight: inventory.weight ?? item.weight,
    length: inventory.length ?? item.length,
    width: inventory.width ?? item.width,
    height: inventory.height ?? item.height,
  };
};

const getBarcodeBars = (value) => {
  const source = String(value || "");
  return Array.from({ length: 42 }, (_, index) => {
    const code = source.charCodeAt(index % Math.max(source.length, 1)) || 47;
    return code % 5 === 0 ? "w-1.5" : code % 3 === 0 ? "w-1" : "w-0.5";
  });
};

const stateColors = [
  "text-amber-500",
  "text-blue-600",
  "text-green-600",
  "text-red-500",
  "text-violet-600",
  "text-slate-900",
];

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [deleteOperation, setDeleteOperation] = useState({ show: false, order: null });
  const dispatch = useDispatch();
  const { data: orders, loading, deleting, pagination, states } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(FetchOrdersAction({ page, rowCount }));
  }, [dispatch, page]);

  const stateCards = useMemo(() => Object.entries(states || {}).map(([label, value], index) => ({
    label,
    value,
    color: stateColors[index % stateColors.length],
  })), [states]);

  const handleRefresh = () => {
    dispatch(FetchOrdersAction({ page, rowCount }));
  };

  const openDeleteQuotation = (order) => {
    if (!order?.id) return;
    setDeleteOperation({ show: true, order });
  };

  const handleDeleteQuotation = () => {
    const orderId = deleteOperation.order?.id;
    if (!orderId) return;

    dispatch(DeleteOrderAction(orderId)).then((response) => {
      toast.success(response.data?.message || "Quotation deleted successfully", { id: "order-delete" });
      setDeleteOperation({ show: false, order: null });

      if (orders.length == 1 && page > 1) {
        setPage((currentPage) => Math.max(currentPage - 1, 1));
      } else {
        dispatch(FetchOrdersAction({ page, rowCount }));
      }
    }).catch((error) => {
      toast.error(error?.response?.data?.message || "Unable to delete quotation", { id: "order-delete" });
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="mb-4 space-y-2">
          <h1 className="text-2xl font-bold text-primary">Order Management</h1>
          <p>Create shipment orders and generate courier quotes before booking.</p>
        </div>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <Link href={PROJECT_URL.DASHBOARD_ORDERS_CREATE} className={buttonVariants({ size: "lg", className: "min-w-36 whitespace-nowrap px-4" })}>
            <PackagePlus />
            Create Order
          </Link>

          <Link href={PROJECT_URL.DASHBOARD_ORDERS_GENERATE} className={buttonVariants({ variant: "outline", size: "lg", className: "min-w-40 whitespace-nowrap px-4" })}>
            <FileText />
            Generate Quote
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-5 flex items-center gap-3">
            <span className="text-[18px] font-medium text-[#4B5A8A]">Total Orders</span>
          </div>
          <h2 className="text-4xl font-bold leading-none text-black">{pagination?.total ?? orders.length ?? 0}</h2>
        </div>

        {stateCards.map((item) => (
          <div key={item.label} className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="mb-5 flex items-center gap-3">
              <span className="text-[18px] font-medium text-[#4B5A8A]">{item.label}</span>
            </div>
            <h2 className={`text-4xl font-bold leading-none ${item.color}`}>{item.value ?? 0}</h2>
          </div>
        ))}
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-slate-950">All Orders</div>
            <p className="text-sm text-muted-foreground">Booked shipments and generated courier labels.</p>
          </div>
          <Button variant="outline" size="icon" type="button" disabled={loading} onClick={handleRefresh}>
            <RefreshCw />
          </Button>
        </div>

        <div className="space-y-3">
          {
            loading ? (
              <div className="rounded border border-dashed bg-white py-12 text-center text-sm text-muted-foreground">
                Loading orders...
              </div>
            ) : !orders.length ? (
              <div className="rounded border border-dashed bg-white py-12 text-center text-sm text-muted-foreground">No orders found.</div>
            ) : orders.map((order) => {
              const initiation = getInitiationAddress(order);
              const destination = getDestinationAddress(order);
              const prices = getPrices(order);

              return (
                <article key={order?.id} className="overflow-hidden rounded border border-slate-200 bg-white text-sm shadow-sm">
                  <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-2">
                      <Box className="size-4 shrink-0 text-blue-600" />
                      <span className="truncate text-base font-bold text-blue-700">{order?.orderId || "-"}</span>
                      <span className="shrink-0 text-sm font-semibold text-slate-500">({order?.referenceNumber || "-"})</span>
                    </div>
                    <span className="text-sm font-medium capitalize text-red-500">{order?.status?.name}</span>
                  </div>

                  <div className="grid gap-0 lg:grid-cols-[1.4fr_1.2fr_1fr]">
                    <div className="space-y-5 border-b border-slate-200 p-4 lg:border-b-0 lg:border-r">
                      <div className="flex items-start gap-3">
                        <div className="grid size-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-[10px] font-black text-violet-700">
                          {order?.service?.carrier?.name.split(" ")[0]?.slice(0, 5) || "Ship"}
                        </div>
                        <div className="min-w-0">
                          <CarrierBrand name={order?.service?.carrier?.name} className="text-lg font-semibold text-slate-950" />
                          <div className="text-xs font-medium text-slate-500">{order?.service?.name}</div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-base font-semibold capitalize text-slate-950">
                          <PackageCheck className="size-4" />
                          {order?.orderType || "Parcel"}
                        </div>

                        {
                          order?.packageLists.length ? order?.packageLists.map((item, index) => {
                            const packageDetails = getPackageDetails(item);
                            const dimensions = [packageDetails.length, packageDetails.width, packageDetails.height].filter((value) => value !== null && value !== undefined && value !== "").map(formatNumber).join("*") || "-";

                            return (
                              <div key={item?.id || index} className="space-y-1">
                                <div className="text-base font-bold text-amber-600">Package #{index + 1}</div>
                                {packageDetails.name && <div className="text-xs font-semibold text-slate-700">Name: {packageDetails.name}</div>}
                                <div className="text-xs font-semibold text-slate-500">Weight: {formatNumber(packageDetails.weight)} lb</div>
                                <div className="text-xs font-semibold text-slate-500">
                                  Dimensions: {dimensions} in
                                </div>
                                <div className="text-xs font-semibold text-slate-500">Insurance: {formatCurrency(item?.insurance || 0, prices.currency, prices.symbol)}</div>
                              </div>
                            );
                          }) : (
                            <div className="text-sm text-muted-foreground">No package details available.</div>
                          )
                        }
                      </div>
                    </div>

                    <div className="flex min-h-56 flex-col justify-center border-b border-slate-200 p-4 lg:border-b-0 lg:border-r">
                      <div className="max-w-lg">
                        <div className="flex items-center gap-2 text-lg font-bold text-slate-950">
                          <span>{destination.title}</span>
                        </div>
                        {destination.phone && <div className="mt-1 text-xs font-semibold text-slate-700">P: {destination.phone}</div>}
                        {destination.company && destination.company !== destination.title && (
                          <div className="text-xs text-slate-500">{destination.company}</div>
                        )}
                        <div className="mt-3 space-y-1 text-base leading-tight text-slate-950">
                          {destination.lines.map((line) => <div key={line}>{line}</div>)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between gap-5 p-4">
                      <div className="flex justify-end">
                        <div className="text-right">
                          <div className="flex h-10 items-end justify-end gap-0.5">
                            {getBarcodeBars(order?.waybillNumber).map((width, index) => (
                              <span key={`${order?.waybillNumber}-${index}`} className={`${width} h-9 bg-black`} />
                            ))}
                          </div>
                          <div className="font-mono text-xs font-bold text-slate-700">{order?.waybillNumber}</div>
                        </div>
                      </div>

                      <div className="space-y-2 text-right">
                        {prices.items.length ? prices.items.map((item) => (
                          <div key={item?.id || `${item?.description}-${item?.amount}`} className="grid grid-cols-[1fr_auto] gap-3 text-xs uppercase text-slate-600">
                            <span>{item?.description || item?.code || "Charge"}:</span>
                            <span className="font-bold text-red-500">{formatCurrency(item?.amount, item?.currency || prices.currency, prices.symbol)}</span>
                          </div>
                        )) : (
                          <div className="grid grid-cols-[1fr_auto] gap-3 text-xs uppercase text-slate-600">
                            <span>Best Price:</span>
                            <span className="font-bold text-red-500">{formatCurrency(prices.total, prices.currency, prices.symbol)}</span>
                          </div>
                        )}
                        <div className="border-t border-dashed border-slate-300 pt-3">
                          <div className="grid grid-cols-[1fr_auto] gap-3 text-base font-black text-slate-950">
                            <span>Grand Total:</span>
                            <span className="text-red-500">{formatCurrency(prices.total, prices.currency, prices.symbol)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="text-xs text-slate-500">
                          <div className="font-semibold text-blue-700">{initiation.company || initiation.title}</div>
                          <div>{moment(order?.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                        </div>
                        {
                          order?.status?.code == "draft" && (
                            <div className="flex items-center justify-end gap-2">
                              <Link href={PROJECT_URL.DASHBOARD_ORDER_GENERATE_BY_ID(order?.id)} className={buttonVariants({ variant: "outline", size: "icon" })} title="Edit quotation" aria-label="Edit quotation">
                                <Pencil />
                              </Link>
                              <Button
                                variant="destructive"
                                size="icon-sm"
                                type="button"
                                title="Delete quotation"
                                aria-label="Delete quotation"
                                onClick={() => openDeleteQuotation(order)}
                              >
                                <Trash />
                              </Button>
                            </div>
                          )
                        }
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          }
        </div>

        <DashboardPagination
          pagination={pagination}
          itemCount={orders.length}
          currentPage={page}
          loading={loading}
          onPageChange={setPage}
        />
      </section>

      <DeleteConfirmationModal
        open={deleteOperation.show}
        onOpenChange={() => setDeleteOperation({ show: false, order: null })}
        title="Delete quotation"
        description={`Are you sure you want to delete quotation #${deleteOperation.order?.orderId || deleteOperation.order?.id || "this quotation"}? This action cannot be undone.`}
        loading={deleting}
        onConfirm={handleDeleteQuotation}
      />
    </div>
  );
}
