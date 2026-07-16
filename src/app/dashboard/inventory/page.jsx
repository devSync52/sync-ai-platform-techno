"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import DashboardPagination from "@/components/DashboardPagination";
import { DeleteInventoryAction, FetchInventoryAction } from "@/services/actions/inventory";
import { Trash } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";

const formatNumber = (value) => Number.isFinite(Number(value)) ? Number(value).toLocaleString() : "0";
const formatMoney = (value) => Number.isFinite(Number(value)) ? `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00";
const formatDate = (value) => value ? new Date(value).toLocaleDateString() : "-";
const getInventorySku = (item) => item?.productSku || item?.productId || item?.metadata?.ID || "-";
const getInventoryName = (item) => item?.name || item?.metadata?.ProductName || "-";
const getInventoryQuantity = (item) => item?.availableQuantity ?? item?.metadata?.InventoryAvailableQty ?? item?.quantity ?? 0;

export default function InventoryPage() {
    const [deleteOperation, setDeleteOperation] = useState({ show: false, item: null });
    const [page, setPage] = useState(1);
    const rowCount = 10;
    const dispatch = useDispatch();
    const { data: inventory, loading, deleting, pagination, states } = useSelector((state) => state.inventory);

    useEffect(() => {
        dispatch(FetchInventoryAction({ page, rowCount }));
    }, [dispatch, page]);

    const inventoryTotals = useMemo(() => {
        const items = inventory || [];

        return {
            available: items.reduce((total, item) => total + Number(getInventoryQuantity(item) || 0), 0),
            providers: new Set(items.map((item) => item?.provider).filter(Boolean)).size
        };
    }, [inventory]);

    const handleDeleteInventory = () => {
        const inventoryId = deleteOperation.item?.id;
        if (!inventoryId) return;

        dispatch(DeleteInventoryAction(inventoryId)).then((response) => {
            toast.success(response.data?.message || "Inventory item deleted successfully", { id: "inventory-delete" });
            setDeleteOperation({ show: false, item: null });

            if (inventory.length == 1 && page > 1) {
                setPage((currentPage) => Math.max(currentPage - 1, 1));
            } else {
                dispatch(FetchInventoryAction({ page, rowCount }));
            }
        }).catch((error) => {
            toast.error(error?.response?.data?.message || "Unable to delete inventory item", { id: "inventory-delete" });
        });
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2 mb-4">
                    <h1 className="text-2xl font-bold text-primary">Inventory Management</h1>
                    <p>Review stocked products and remove inventory records</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-5">
                        <span className="text-[18px] text-[#4B5A8A] font-medium">Total Items</span>
                    </div>
                    <h2 className="text-4xl font-bold text-black leading-none">{pagination?.total ?? inventory?.length ?? 0}</h2>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-5">
                        <span className="text-[18px] text-[#4B5A8A] font-medium">Active</span>
                    </div>
                    <h2 className="text-4xl font-bold text-green-500 leading-none">{states?.active ?? 0}</h2>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-5">
                        <span className="text-[18px] text-[#4B5A8A] font-medium">Available Qty</span>
                    </div>
                    <h2 className="text-4xl font-bold text-blue-500 leading-none">{formatNumber(inventoryTotals.available)}</h2>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-5">
                        <span className="text-[18px] text-[#4B5A8A] font-medium">Providers</span>
                    </div>
                    <h2 className="text-4xl font-bold text-purple-500 leading-none">{inventoryTotals.providers}</h2>
                </div>
            </div>

            <Card className="p-4 bg-white">
                <div className="flex justify-between items-center mb-3">
                    <div className="text-lg font-medium">All Inventory</div>
                    <div className="text-sm text-muted-foreground">
                        Page {pagination?.page || page} of {pagination?.totalPages || 1}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-muted-foreground">
                            <tr className="border-b text-left">
                                <th className="py-2 pr-3">SKU</th>
                                <th className="py-2 pr-3">Product Name</th>
                                <th className="py-2 pr-3">Provider</th>
                                <th className="py-2 pr-3">Warehouse</th>
                                <th className="py-2 pr-3">Available Qty</th>
                                <th className="py-2 pr-3">Price</th>
                                <th className="py-2 pr-3">Weight</th>
                                <th className="py-2 pr-3">Created</th>
                                <th className="py-2 pr-3">Status</th>
                                <th className="py-2 pr-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td className="py-6 text-center text-muted-foreground" colSpan={10}>Loading inventory...</td>
                                </tr>
                            )}

                            {!loading && !inventory?.length && (
                                <tr>
                                    <td className="py-6 text-center text-muted-foreground" colSpan={10}>No inventory found.</td>
                                </tr>
                            )}

                            {!loading && inventory?.map((item, index) => (
                                <tr key={item.id || index} className="border-b last:border-0">
                                    <td className="py-2 pr-3 font-medium">{getInventorySku(item)}</td>
                                    <td className="py-2 pr-3">{getInventoryName(item)}</td>
                                    <td className="py-2 pr-3">{item?.provider || "-"}</td>
                                    <td className="py-2 pr-3">{item?.warehouse?.name || item?.metadata?.WarehouseName || "-"}</td>
                                    <td className="py-2 pr-3">{formatNumber(getInventoryQuantity(item))}</td>
                                    <td className="py-2 pr-3">{formatMoney(item?.price ?? item?.metadata?.SitePrice)}</td>
                                    <td className="py-2 pr-3">{formatNumber(item?.weight ?? item?.metadata?.Weight)} lb</td>
                                    <td className="py-2 pr-3">{formatDate(item?.createdAt || item?.metadata?.CreationDate)}</td>
                                    <td className="py-2 pr-3">
                                        <span className={`capitalize inline-flex items-center rounded-md px-2 py-1 text-sm font-medium ${item?.status == "active" ? "bg-green-50 text-green-700 inset-ring inset-ring-green-600/10" : "bg-slate-100 text-slate-600 inset-ring inset-ring-slate-500/10"}`}>
                                            {item?.status || "-"}
                                        </span>
                                    </td>
                                    <td className="py-2 pr-3">
                                        <Button variant="outline" size="icon" onClick={() => setDeleteOperation({ show: true, item })}>
                                            <Trash />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <DashboardPagination
                    pagination={pagination}
                    itemCount={inventory?.length || 0}
                    currentPage={page}
                    loading={loading}
                    onPageChange={setPage}
                />
            </Card>

            <DeleteConfirmationModal
                open={deleteOperation.show}
                onOpenChange={() => setDeleteOperation({ show: false, item: null })}
                title="Delete inventory item"
                description={`Are you sure you want to delete ${getInventoryName(deleteOperation.item)}? This action cannot be undone.`}
                loading={deleting}
                onConfirm={handleDeleteInventory}
            />
        </div>
    );
}
