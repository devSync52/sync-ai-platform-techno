"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, PackagePlus, Pencil, RefreshCw, Trash } from "lucide-react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { DeleteOrderAction, FetchOrdersAction } from "@/services/actions/orders";
import moment from "moment-timezone";

const rowCount = 10;

const getPackages = (order) => {
  const packageList = order.packageLists;
  if (Array.isArray(packageList)) return packageList;
  return packageList.packages || order?.packages || [];
};

const getWeight = (order) => getPackages(order).reduce((total, item) => total + Number(item?.weight || 0), 0) || "-";
const getDimensions = (order) => getPackages(order).map((item) => {
  return [item.length, item.width, item.height].filter((value) => value !== undefined && value !== null && value !== "").join("*");
}).filter(Boolean).join(" ");

const getBestPrice = (order) => order?.bestPrice || order?.best_price || order?.amount || order?.total || order?.charge || "-";

const getAddressBlock = (address) => {
  if (!address || typeof address == "string") return { title: address || "-", lines: [] };

  const title = address.name || address.company || "-";
  const phone = address.phone || address.mobile_phone || address.mobilePhone;
  const addressLine = address.address || address.address1;
  const location = [address.city, address.province?.name || address.province, address.postalcode || address.postalCode].filter(Boolean).join(", ");

  return {
    title,
    lines: [phone ? `P: ${phone}` : "", addressLine, address.address2, location].filter(Boolean),
  };
};
const getInitiationAddress = (order) => getAddressBlock(order?.initiation || order?.source || order?.from);
const getDestinationAddress = (order) => getAddressBlock(order?.destination || order?.to);

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [deleteOperation, setDeleteOperation] = useState({ show: false, order: null });
  const dispatch = useDispatch();
  const { data: orders, loading, deleting, pagination, states } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(FetchOrdersAction({ page, rowCount }));
  }, [dispatch, page]);

  const completedCount = useMemo(() => states?.completed ?? states?.complete ?? 0, [states]);
  const quotationCount = useMemo(() => states?.quotation ?? 0, [states]);

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
          <Link href="/dashboard/orders/create" className={buttonVariants({ size: "lg", className: "min-w-36 whitespace-nowrap px-4" })}>
            <PackagePlus />
            Create Order
          </Link>

          <Link href="/dashboard/orders/generate" className={buttonVariants({ variant: "outline", size: "lg", className: "min-w-40 whitespace-nowrap px-4" })}>
            <FileText />
            Generate Quote
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-5 flex items-center gap-3">
            <span className="text-[18px] font-medium text-[#4B5A8A]">Total Orders</span>
          </div>
          <h2 className="text-4xl font-bold leading-none text-black">{pagination?.total ?? orders.length ?? 0}</h2>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-5 flex items-center gap-3">
            <span className="text-[18px] font-medium text-[#4B5A8A]">Quotation</span>
          </div>
          <h2 className="text-4xl font-bold leading-none text-amber-500">{quotationCount}</h2>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-5 flex items-center gap-3">
            <span className="text-[18px] font-medium text-[#4B5A8A]">Completed</span>
          </div>
          <h2 className="text-4xl font-bold leading-none text-green-500">{completedCount}</h2>
        </div>
      </div>

      <Card className="bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-lg font-medium">All Orders</div>
          <Button variant="outline" size="icon" type="button" disabled={loading} onClick={handleRefresh}>
            <RefreshCw />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-300 text-sm">
            <thead className="bg-slate-50 text-slate-900">
              <tr className="border-b text-left">
                <th className="px-3 py-2 text-center">ID/DateTime</th>
                <th className="px-3 py-2">Package Type</th>
                <th className="px-3 py-2">Initiation</th>
                <th className="px-3 py-2">Destination</th>
                <th className="px-3 py-2">Weight(Lb)</th>
                <th className="px-3 py-2">Dimensions(In)</th>
                <th className="px-3 py-2">BEST PRICE</th>
                <th className="px-3 py-2">Operation</th>
              </tr>
            </thead>
            <tbody>
              {
                loading ? (
                  <tr>
                    <td className="py-6 text-center text-muted-foreground" colSpan={9}>
                      Loading orders...
                    </td>
                  </tr>
                ) : !orders.length ? (
                  <tr>
                    <td className="py-6 text-center text-muted-foreground" colSpan={9}>No orders found.</td>
                  </tr>
                ) : orders.map((order) => {
                  const initiation = getInitiationAddress(order);
                  const destination = getDestinationAddress(order);

                  return (
                    <tr key={order?.id} className="border-b align-top last:border-0">
                      <td className="px-3 py-4 text-center">
                        <div className="font-medium">#{order?.orderId || "-"}</div>
                        <div className="mt-5 text-xs text-red-500">{moment(order?.createdAt).format("LLLL")}</div>
                        <div className="mt-1 text-xs text-blue-600">{order?.status}</div>
                      </td>
                      <td className="px-3 py-4 capitalize">{order?.orderType}</td>
                      <td className="px-3 py-4">
                        <div className="font-semibold">{initiation.title}</div>
                        {initiation.lines.map((line) => <div key={line} className="text-xs text-slate-700">{line}</div>)}
                      </td>
                      <td className="px-3 py-4">
                        <div className="font-semibold">{destination.title}</div>
                        {destination.lines.map((line) => <div key={line} className="text-xs text-slate-700">{line}</div>)}
                      </td>
                      <td className="px-3 py-4">{getWeight(order)}</td>
                      <td className="px-3 py-4">{getDimensions(order) || "-"}</td>
                      <td className="px-3 py-4">{getBestPrice(order)}</td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-2">
                          {
                            order?.status == "quotation" && (
                              <>
                                <Link href={`/dashboard/orders/generate/${order?.id}`} className={buttonVariants({ variant: "outline", size: "icon" })}>
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
                              </>
                            )
                          }
                        </div>
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination?.offset || 0) + (orders.length ? 1 : 0)}-{(pagination?.offset || 0) + orders.length} of {pagination?.total || 0}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" type="button" disabled={loading || (pagination?.page || page) <= 1} onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}>
              Previous
            </Button>
            <Button variant="outline" type="button" disabled={loading || (pagination?.page || page) >= (pagination?.totalPages || 1)} onClick={() => setPage((currentPage) => currentPage + 1)}>
              Next
            </Button>
          </div>
        </div>
      </Card>

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
