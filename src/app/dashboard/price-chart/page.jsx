"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Download, Edit, Plus, Trash, Upload } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { DeletePriceAction, ExportPricesAction, FetchPricesAction, UpdatePriceAction } from "@/services/actions/prices";
import PriceImport from "./components/import";
import PriceOperation from "./components/operation";

const getPriceId = (price) => price?.id || price?._id || price?.priceId;

const formatMoney = (value) => {
    const amount = Number(value || 0);

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: amount % 1 == 0 ? 0 : 2
    }).format(amount);
};

const getStatus = (price) => price?.status || "active";
const getPriceType = (price) => price?.priceType || price?.type || "flat";
const getServiceChargeType = (price) => price?.serviceChargeType || price?.chargeType || "flat";

const formatServiceCharge = (price) => {
    const amount = Number(price?.serviceCharge || 0);

    if (getServiceChargeType(price) == "percentage") {
        return `${amount % 1 == 0 ? amount : amount.toFixed(2)}%`;
    }

    return formatMoney(amount);
};

const getStateLabel = (state, index) => {
    if (typeof state == "string") return state;
    return state?.name || state?.label || state?.state || state?.status || `State ${index + 1}`;
};

const getStateValue = (state) => {
    if (typeof state == "number") return state;
    if (typeof state == "string") return null;
    return state?.count ?? state?.total ?? state?.value ?? null;
};

export default function PriceChartPage() {
    const dispatch = useDispatch();
    const { data: prices, states, loading, deleting } = useSelector((state) => state.prices);
    const [operation, setOperation] = useState({ show: false, details: null });
    const [importOpen, setImportOpen] = useState(false);
    const [deleteOperation, setDeleteOperation] = useState({ show: false, price: null });
    const [exporting, setExporting] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(null);

    useEffect(() => {
        dispatch(FetchPricesAction());
    }, [dispatch]);

    const stats = useMemo(() => {
        const total = prices?.length || 0;
        const active = prices?.filter((price) => getStatus(price) == "active").length || 0;
        const serviceChargeTotal = prices?.reduce((sum, price) => sum + Number(price.serviceCharge || 0), 0) || 0;
        const highestBand = prices?.reduce((highest, price) => Math.max(highest, Number(price.maxPrice || 0)), 0) || 0;

        return {
            total,
            active,
            inactive: Math.max(total - active, 0),
            averageServiceCharge: total ? serviceChargeTotal / total : 0,
            highestBand
        };
    }, [prices]);

    const sortedPrices = useMemo(() => {
        return [...(prices || [])].sort((a, b) => Number(a.minPrice || 0) - Number(b.minPrice || 0));
    }, [prices]);

    const handleDeletePrice = () => {
        const priceId = getPriceId(deleteOperation.price);
        if (!priceId) return;

        dispatch(DeletePriceAction(priceId)).then((response) => {
            toast.success(response.data?.message || "Price deleted successfully", { id: "price-delete" });
            setDeleteOperation({ show: false, price: null });
            dispatch(FetchPricesAction());
        }).catch((error) => {
            toast.error(error?.response?.data?.message || "Unable to delete price", { id: "price-delete" });
        });
    };

    const handleStatusChange = (price) => {
        const priceId = getPriceId(price);
        if (!priceId) return;

        const nextStatus = getStatus(price) == "active" ? "deactive" : "active";
        setUpdatingStatus(priceId);

        dispatch(UpdatePriceAction(priceId, {
            minPrice: Number(price.minPrice || 0),
            maxPrice: Number(price.maxPrice || 0),
            priceType: getPriceType(price),
            serviceCharge: Number(price.serviceCharge || 0),
            serviceChargeType: getServiceChargeType(price),
            status: nextStatus
        })).then((response) => {
            toast.success(response.data?.message || "Price status updated successfully", { id: "price-status" });
            dispatch(FetchPricesAction());
        }).catch((error) => {
            toast.error(error?.response?.data?.message || "Unable to update price status", { id: "price-status" });
        }).finally(() => {
            setUpdatingStatus(null);
        });
    };

    const handleExportPrices = () => {
        setExporting(true);

        dispatch(ExportPricesAction()).then((response) => {
            const blob = new Blob([response.data], { type: response.headers?.["content-type"] || "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            const disposition = response.headers?.["content-disposition"];
            const filename = disposition?.match(/filename="?([^"]+)"?/)?.[1] || "price-chart.csv";

            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success("Prices exported successfully", { id: "price-export" });
        }).catch((error) => {
            toast.error(error?.response?.data?.message || "Unable to export prices", { id: "price-export" });
        }).finally(() => {
            setExporting(false);
        });
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-primary">Price Chart</h1>
                    <p>Manage delivery price bands and service charges.</p>
                </div>
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                    <Button variant="outline" size="lg" type="button" onClick={() => setImportOpen(true)}>
                        <Upload />
                        Import
                    </Button>
                    <Button variant="outline" size="lg" type="button" onClick={handleExportPrices} disabled={exporting}>
                        <Download />
                        {exporting ? "Exporting..." : "Export"}
                    </Button>
                    <Button size="lg" onClick={() => setOperation({ show: true, details: null })}>
                        <Plus />
                        Add Price
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="interactive-card rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="mb-5 text-[18px] font-medium text-[#4B5A8A]">Total Bands</div>
                    <h2 className="text-4xl font-bold leading-none text-black">{stats.total}</h2>
                </div>
                <div className="interactive-card rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="mb-5 text-[18px] font-medium text-[#4B5A8A]">Active</div>
                    <h2 className="text-4xl font-bold leading-none text-green-500">{stats.active}</h2>
                </div>
                <div className="interactive-card rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="mb-5 text-[18px] font-medium text-[#4B5A8A]">Average Charge</div>
                    <h2 className="text-4xl font-bold leading-none text-[#6700e7]">{formatMoney(stats.averageServiceCharge)}</h2>
                </div>
                <div className="interactive-card rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="mb-5 text-[18px] font-medium text-[#4B5A8A]">Highest Band</div>
                    <h2 className="text-4xl font-bold leading-none text-slate-950">{formatMoney(stats.highestBand)}</h2>
                </div>
            </div>

            {!!states?.length && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {states.slice(0, 6).map((state, index) => {
                        const value = getStateValue(state);
                        return (
                            <div key={`${getStateLabel(state, index)}-${index}`} className="rounded-2xl border border-purple-100 bg-white/80 px-4 py-3 shadow-sm">
                                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7d708e]">State</div>
                                <div className="mt-1 flex items-center justify-between gap-3">
                                    <span className="font-semibold text-slate-950">{getStateLabel(state, index)}</span>
                                    {value !== null && <span className="rounded-full bg-purple-50 px-3 py-1 text-sm font-semibold text-primary">{value}</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Card className="bg-white p-4">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="text-lg font-medium">All Price Bands</div>
                        <div className="text-sm text-muted-foreground">Sorted from lowest to highest range</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{prices?.length || 0} records</div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-muted-foreground">
                            <tr className="border-b text-left">
                                <th className="py-2 pr-3">Range</th>
                                <th className="py-2 pr-3">Minimum</th>
                                <th className="py-2 pr-3">Maximum</th>
                                <th className="py-2 pr-3">Price Type</th>
                                <th className="py-2 pr-3">Service Charge</th>
                                <th className="py-2 pr-3">Charge Type</th>
                                <th className="py-2 pr-3">Status</th>
                                <th className="py-2 pr-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td className="py-6 text-center text-muted-foreground" colSpan={8}>Loading price chart...</td>
                                </tr>
                            )}

                            {!loading && !sortedPrices.length && (
                                <tr>
                                    <td className="py-6 text-center text-muted-foreground" colSpan={8}>No price bands found.</td>
                                </tr>
                            )}

                            {!loading && sortedPrices.map((price, index) => {
                                const priceId = getPriceId(price) || index;
                                const active = getStatus(price) == "active";

                                return (
                                    <tr key={priceId} className="border-b last:border-0">
                                        <td className="py-3 pr-3">
                                            <div className="font-semibold text-slate-950">Band {index + 1}</div>
                                            <div className="text-xs text-muted-foreground">{formatMoney(price.minPrice)} - {formatMoney(price.maxPrice)}</div>
                                        </td>
                                        <td className="py-3 pr-3">{formatMoney(price.minPrice)}</td>
                                        <td className="py-3 pr-3">{formatMoney(price.maxPrice)}</td>
                                        <td className="py-3 pr-3 capitalize">{getPriceType(price)}</td>
                                        <td className="py-3 pr-3">
                                            <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-primary">
                                                {formatServiceCharge(price)}
                                            </span>
                                        </td>
                                        <td className="py-3 pr-3 capitalize">{getServiceChargeType(price)}</td>
                                        <td className="py-3 pr-3">
                                            <button
                                                type="button"
                                                onClick={() => handleStatusChange(price)}
                                                disabled={updatingStatus == priceId}
                                                className={`inline-flex items-center rounded-md px-2 py-1 text-sm font-medium capitalize transition ${active ? "bg-green-50 text-green-700 inset-ring inset-ring-green-600/10" : "bg-slate-100 text-slate-600 inset-ring inset-ring-slate-500/10"}`}
                                            >
                                                {updatingStatus == priceId ? "Updating..." : getStatus(price)}
                                            </button>
                                        </td>
                                        <td className="py-3 pr-3">
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="icon" onClick={() => setOperation({ show: true, details: price })}>
                                                    <Edit />
                                                </Button>
                                                <Button variant="outline" size="icon" onClick={() => setDeleteOperation({ show: true, price })}>
                                                    <Trash />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            {operation.show && (
                <PriceOperation
                    open={operation.show}
                    details={operation.details}
                    handleClose={() => setOperation({ show: false, details: null })}
                />
            )}

            {importOpen && (
                <PriceImport
                    open={importOpen}
                    handleClose={() => setImportOpen(false)}
                />
            )}

            <DeleteConfirmationModal
                open={deleteOperation.show}
                onOpenChange={() => setDeleteOperation({ show: false, price: null })}
                title="Delete price band"
                description={`Are you sure you want to delete ${deleteOperation.price ? `${formatMoney(deleteOperation.price.minPrice)} - ${formatMoney(deleteOperation.price.maxPrice)}` : "this price band"}? This action cannot be undone.`}
                loading={deleting}
                onConfirm={handleDeletePrice}
            />
        </div>
    );
}
