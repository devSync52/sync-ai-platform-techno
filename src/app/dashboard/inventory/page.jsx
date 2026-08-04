"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import DashboardPagination from "@/components/DashboardPagination";
import { DeleteInventoryAction, FetchInventoryAction } from "@/services/actions/inventory";
import { Plus, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import InventoryOperation from "./InventoryOperation";

const formatNumber = (value) => Number.isFinite(Number(value)) ? Number(value).toLocaleString() : "0";
const formatMoney = (value) => Number.isFinite(Number(value)) ? `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00";
const formatDate = (value) => value ? new Date(value).toLocaleDateString() : "-";
const getInventorySku = (item) => item?.productSku || item?.productId || item?.metadata?.ID || "-";
const getInventoryName = (item) => item?.name || item?.metadata?.ProductName || "-";
const getInventoryQuantity = (item) => item?.availableQuantity ?? item?.metadata?.InventoryAvailableQty ?? item?.quantity ?? 0;

export default function InventoryPage() {
    const [deleteOperation, setDeleteOperation] = useState({ show: false, item: null });
    const [createOpen, setCreateOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [rowCount, setRowCount] = useState(10);
    const dispatch = useDispatch();
    const { data: inventory, loading, deleting, pagination, states } = useSelector((state) => state.inventory);

    useEffect(() => {
        dispatch(FetchInventoryAction({ page, rowCount }));
    }, [dispatch, page, rowCount]);

    const availableItems = Number(states?.available || 0);
    const unavailableItems = Number(states?.unavailable || 0);
    const totalItems = availableItems + unavailableItems;
    const availableQuantity = states?.availableQuantity?._sum?.availableQuantity ?? 0;

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
        <div className="px-4 py-6 xl:px-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2 mb-4">
                    <h1 className="text-2xl font-bold text-primary">Inventory Management</h1>
                    <p>Review stocked products and remove inventory records</p>
                </div>
                <Button onClick={() => setCreateOpen(true)}><Plus />Add Inventory</Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-5">
                        <span className="text-[18px] text-[#4B5A8A] font-medium">Total Items</span>
                    </div>
                    <h2 className="text-4xl font-bold text-black leading-none">{formatNumber(totalItems)}</h2>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-5">
                        <span className="text-[18px] text-[#4B5A8A] font-medium">Available</span>
                    </div>
                    <h2 className="text-4xl font-bold text-green-500 leading-none">{formatNumber(availableItems)}</h2>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-5">
                        <span className="text-[18px] text-[#4B5A8A] font-medium">Unavailable</span>
                    </div>
                    <h2 className="text-4xl font-bold text-red-500 leading-none">{formatNumber(unavailableItems)}</h2>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-5">
                        <span className="text-[18px] text-[#4B5A8A] font-medium">Available Qty</span>
                    </div>
                    <h2 className="text-4xl font-bold text-blue-500 leading-none">{formatNumber(availableQuantity)}</h2>
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
                    <table className="w-full text-sm whitespace-nowrap">
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
                                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-sm font-medium ${Number(getInventoryQuantity(item)) > 0 ? "bg-green-50 text-green-700 inset-ring inset-ring-green-600/10" : "bg-red-50 text-red-700 inset-ring inset-ring-red-600/10"}`}>
                                            {Number(getInventoryQuantity(item)) > 0 ? "Available" : "Not Available"}
                                        </span>
                                    </td>
                                    <td className="py-2 pr-3">
                                        {!item?._syncSource && (
                                            <Button variant="outline" size="icon" onClick={() => setDeleteOperation({ show: true, item })}>
                                                <Trash />
                                            </Button>
                                        )}
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
                    rowsPerPage={rowCount}
                    onRowsPerPageChange={(value) => { setPage(1); setRowCount(value); }}
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
            <InventoryOperation open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => dispatch(FetchInventoryAction({ page, rowCount }))} />
        </div>
    );
}
