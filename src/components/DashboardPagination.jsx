"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DashboardPagination({
    pagination,
    itemCount = 0,
    currentPage = 1,
    loading = false,
    onPageChange,
    rowsPerPage,
    rowsPerPageOptions = [10, 25, 50, 100],
    onRowsPerPageChange,
    className,
}) {
    const page = pagination?.page || currentPage || 1;
    const totalPages = pagination?.totalPages || 1;
    const total = pagination?.total || 0;
    const offset = pagination?.offset || 0;
    const from = itemCount ? offset + 1 : 0;
    const to = offset + itemCount;
    const canGoPrevious = !loading && page > 1;
    const canGoNext = !loading && page < totalPages;

    return (
        <div className={cn("mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3", className)}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">
                        Showing {from}-{to} of {total}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                        Page {page} of {totalPages}
                    </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    {onRowsPerPageChange && (
                        <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                            Rows per page
                            <select
                                value={rowsPerPage || pagination?.rowCount || rowsPerPageOptions[0]}
                                disabled={loading}
                                onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
                                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {rowsPerPageOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                            </select>
                        </label>
                    )}

                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:flex">
                        <Button
                            variant="outline"
                            type="button"
                            disabled={!canGoPrevious}
                            onClick={() => onPageChange?.(Math.max(page - 1, 1))}
                            className="justify-center"
                        >
                            <ChevronLeft className="size-4" />
                            Previous
                        </Button>

                        <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-700 shadow-sm">
                            {page}
                        </span>

                        <Button
                            variant="outline"
                            type="button"
                            disabled={!canGoNext}
                            onClick={() => onPageChange?.(page + 1)}
                            className="justify-center"
                        >
                            Next
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
