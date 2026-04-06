"use client";

import { useEffect, useRef, useState } from "react";
import { useSupabase } from "@/components/supabase-provider";
import { Button } from "@/components/ui/button";
import OrderDetailsSc from "@/components/modals/OrderDetailsSc";
import { SyncOrdersButton } from "@/components/buttons/SyncOrdersButton";
import FilterBar from "@/components/FilterBar";
import { Circle, CheckCircle2, Package, PackageCheck, Truck, } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { subDays } from "date-fns";
import Image from "next/image";
import moment from "moment-timezone";
import "@/styles/daypicker-custom.css";
import SellerCloudOrderProgress from "./components/sellerCloudOrderProgress";

const sellerCloudStatus = Object.freeze({
  0: {
    name: "Cart",
    style: {
      backgroundColor: "rgba(59, 130, 246, 0.16)",
      color: "#1d4ed8",
      borderColor: "rgba(59, 130, 246, 0.82)",
    }
  },
  1: {
    name: "New",
    style: {
      backgroundColor: "rgba(99, 102, 241, 0.16)",
      color: "#4338ca",
      borderColor: "rgba(99, 102, 241, 0.82)",
    }
  },
  2: {
    name: "Processing",
    style: {
      backgroundColor: "rgba(251, 191, 36, 0.18)",
      color: "#b45309",
      borderColor: "rgba(251, 191, 36, 0.85)",
    }
  },
  3: {
    name: "In Process",
    style: {
      backgroundColor: "rgba(59, 130, 246, 0.18)",
      color: "#1e40af",
      borderColor: "rgba(59, 130, 246, 0.9)",
    }
  },
  4: {
    name: "Partially Shipped",
    style: {
      backgroundColor: "rgba(251, 146, 60, 0.18)",
      color: "#c2410c",
      borderColor: "rgba(251, 146, 60, 0.9)",
    }
  },
  5: {
    name: "Shipped",
    style: {
      backgroundColor: "rgba(34, 197, 94, 0.18)",
      color: "#166534",
      borderColor: "rgba(34, 197, 94, 0.9)",
    }
  },
  6: {
    name: "Cancelled",
    style: {
      backgroundColor: "rgba(239, 68, 68, 0.18)",
      color: "#991b1b",
      borderColor: "rgba(239, 68, 68, 0.9)",
    }
  },
  7: {
    name: "On Hold",
    style: {
      backgroundColor: "rgba(168, 85, 247, 0.18)",
      color: "#6b21a8",
      borderColor: "rgba(168, 85, 247, 0.9)",
    }
  },
  8: {
    name: "Problem",
    style: {
      backgroundColor: "rgba(220, 38, 38, 0.2)",
      color: "#7f1d1d",
      borderColor: "rgba(220, 38, 38, 0.95)",
    }
  },
  9: {
    name: "Returned",
    style: {
      backgroundColor: "rgba(244, 63, 94, 0.18)",
      color: "#9f1239",
      borderColor: "rgba(244, 63, 94, 0.9)",
    }
  },
  10: {
    name: "Completed",
    style: {
      backgroundColor: "rgba(16, 185, 129, 0.18)",
      color: "#065f46",
      borderColor: "rgba(16, 185, 129, 0.9)",
    }
  },
});

type SellerCloudStatusType = typeof sellerCloudStatus[keyof typeof sellerCloudStatus];

export const getSellerCloudStatus = (code: number): SellerCloudStatusType => {
  return sellerCloudStatus[code as keyof typeof sellerCloudStatus] || {
    name: "Unknown",
    style: {
      backgroundColor: "rgba(107, 114, 128, 0.2)",
      color: "#374151",
      borderColor: "rgba(107, 114, 128, 0.8)",
    }
  };
};



const PARTIAL_ALLOCATED_STATUS = "Partial Allocated";
const EXTENSIV_STATUS_ORDER = [
  "Created",
  "Allocated",
  "Picked",
  "Packed",
  "Shipped",
] as const;
type LifecycleStage =
  | "created"
  | "partial_allocated"
  | "allocated"
  | "picked"
  | "packed"
  | "shipped"
  | "other";

const LIFECYCLE_STAGE_COLORS: Record<
  LifecycleStage,
  { chipBg: string; textColor: string; barColor: string }
> = {
  created: {
    chipBg: "rgba(59, 130, 246, 0.16)",
    textColor: "#1d4ed8",
    barColor: "rgba(59, 130, 246, 0.82)",
  },
  partial_allocated: {
    chipBg: "rgba(245, 158, 11, 0.2)",
    textColor: "#b45309",
    barColor: "rgba(245, 158, 11, 0.84)",
  },
  allocated: {
    chipBg: "rgba(99, 102, 241, 0.16)",
    textColor: "#4338ca",
    barColor: "rgba(99, 102, 241, 0.82)",
  },
  picked: {
    chipBg: "rgba(6, 182, 212, 0.18)",
    textColor: "#0e7490",
    barColor: "rgba(6, 182, 212, 0.82)",
  },
  packed: {
    chipBg: "rgba(236, 72, 153, 0.18)",
    textColor: "#be185d",
    barColor: "rgba(236, 72, 153, 0.82)",
  },
  shipped: {
    chipBg: "rgba(16, 185, 129, 0.18)",
    textColor: "#047857",
    barColor: "rgba(16, 185, 129, 0.85)",
  },
  other: {
    chipBg: "rgba(148, 163, 184, 0.16)",
    textColor: "#475569",
    barColor: "rgba(148, 163, 184, 0.65)",
  },
};

const EXTENSIV_STEP_TO_STAGE: Record<
  (typeof EXTENSIV_STATUS_ORDER)[number],
  Extract<
    LifecycleStage,
    "created" | "allocated" | "picked" | "packed" | "shipped"
  >
> = {
  Created: "created",
  Allocated: "allocated",
  Picked: "picked",
  Packed: "packed",
  Shipped: "shipped",
};
const EXTENSIV_STATUS_FILTER_ORDER = [
  "Created",
  PARTIAL_ALLOCATED_STATUS,
  "Allocated",
  "Picked",
  "Packed",
  "Shipped",
] as const;
const EXTENSIV_STATUS_FILTER_ORDER_SET = new Set<string>(
  EXTENSIV_STATUS_FILTER_ORDER,
);
const EXTENSIV_STATUS_LABEL: Record<
  (typeof EXTENSIV_STATUS_ORDER)[number],
  string
> = {
  Created: "Created",
  Allocated: "Allocated",
  Picked: "Picked",
  Packed: "Packed",
  Shipped: "Shipped",
};
const MARKETPLACE_LOGOS: Record<string, string> = {
  amazon: "/logos/amazon.png",
  ebay: "/logos/ebay.png",
  walmart: "/logos/walmart.png",
  wayfair: "/logos/wayfair.png",
  website: "/logos/website.png",
  fba: "/logos/fba.png",
  magento: "/logos/marketplace.png",
  custom: "/logos/marketplace.png",
  unknown: "/logos/unknown.png",
};

function toExtensivStatusKey(status: unknown): string {
  return String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function normalizeExtensivStatus(status: unknown, options?: { statusFullyAllocated?: unknown; },): string {
  const raw = String(status ?? "").trim();
  const normalized = toExtensivStatusKey(raw);

  if (normalized === "partialallocated") return PARTIAL_ALLOCATED_STATUS;
  if (options?.statusFullyAllocated === false && (normalized === "ordercomplete" || normalized === "completed")) {
    return PARTIAL_ALLOCATED_STATUS;
  }
  if (normalized === "created") return "Created";
  if (
    normalized === "allocated" ||
    normalized === "completed" ||
    normalized === "separated" ||
    normalized === "ordercomplete" ||
    normalized === "fullyallocated"
  ) {
    return "Allocated";
  }
  if (
    normalized === "picked" ||
    normalized === "orderpickjobdone" ||
    normalized === "orderpickdone" ||
    normalized === "pickjobdone"
  ) {
    return "Picked";
  }
  if (
    normalized === "packed" ||
    normalized === "orderpacked" ||
    normalized === "orderpaked" ||
    normalized === "packcomplete"
  ) {
    return "Packed";
  }
  if (
    ["shipped", "confirmed", "closed", "fulfilled", "delivered"].includes(
      normalized,
    )
  )
    return "Shipped";
  return raw;
}

function parseQueryDate(value: string | null): Date | undefined {
  const raw = String(value ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return undefined;
  const date = new Date(`${raw}T12:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function buildDefaultOrdersRange(isOperationalSource: boolean): DateRange {
  const to = new Date();
  return {
    from: subDays(to, isOperationalSource ? 1 : 6),
    to,
  };
}

function toISODateFromCalendar(date?: Date): string {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysToISODate(dateISO: string, days: number): string {
  const [year, month, day] = dateISO.split("-").map(Number);
  if (!year || !month || !day) return dateISO;
  return toISODateFromCalendar(new Date(year, month - 1, day + days));
}

function getStatusStage(status: unknown): LifecycleStage {
  const normalized = toExtensivStatusKey(status);

  if (normalized === "partialallocated") return "partial_allocated";
  if (normalized === "created") return "created";
  if (
    normalized === "allocated" ||
    normalized === "completed" ||
    normalized === "separated" ||
    normalized === "ordercomplete" ||
    normalized === "fullyallocated"
  ) {
    return "allocated";
  }
  if (
    normalized === "picked" ||
    normalized === "orderpickjobdone" ||
    normalized === "orderpickdone" ||
    normalized === "pickjobdone"
  ) {
    return "picked";
  }
  if (
    normalized === "packed" ||
    normalized === "orderpacked" ||
    normalized === "orderpaked" ||
    normalized === "packcomplete"
  ) {
    return "packed";
  }
  if (
    ["shipped", "confirmed", "closed", "fulfilled", "delivered"].includes(
      normalized,
    )
  )
    return "shipped";
  return "other";
}

function applyExtensivStatusFilter(
  query: any,
  statusFilter: string,
  extensivStatusFilterMap: Record<string, string[]>,
) {
  if (statusFilter === "Shipped") {
    return query.or(
      "last_event_name.ilike.shipped,last_event_name.ilike.confirmed,last_event_name.ilike.closed,last_event_name.ilike.fulfilled,last_event_name.ilike.delivered,status_closed.eq.true",
    );
  }

  if (statusFilter === PARTIAL_ALLOCATED_STATUS) {
    return query.or(
      "last_event_name.ilike.partialallocated,last_event_name.ilike.%partial%allocated%,and(status_fully_allocated.eq.false,last_event_name.ilike.ordercomplete),and(status_fully_allocated.eq.false,last_event_name.ilike.completed)",
    );
  }

  if (statusFilter === "Allocated") {
    return query.or(
      "last_event_name.ilike.allocated,last_event_name.ilike.separated,last_event_name.ilike.fullyallocated,last_event_name.ilike.%fully%allocated%,and(status_fully_allocated.eq.true,last_event_name.ilike.ordercomplete),and(status_fully_allocated.is.null,last_event_name.ilike.ordercomplete),and(status_fully_allocated.eq.true,last_event_name.ilike.completed),and(status_fully_allocated.is.null,last_event_name.ilike.completed)",
    );
  }

  if (statusFilter === "Picked") {
    return query.or(
      "last_event_name.ilike.picked,last_event_name.ilike.orderpickjobdone,last_event_name.ilike.orderpickdone,last_event_name.ilike.pickjobdone",
    );
  }

  if (statusFilter === "Packed") {
    return query.or(
      "last_event_name.ilike.packed,last_event_name.ilike.orderpacked,last_event_name.ilike.orderpaked,last_event_name.ilike.packcomplete",
    );
  }

  if (statusFilter === "Created") {
    return query.or("last_event_name.ilike.created");
  }

  const rawVariants = extensivStatusFilterMap[statusFilter] ?? [statusFilter];
  if (!rawVariants.length) return query.eq("last_event_name", statusFilter);
  return rawVariants.length > 1
    ? query.in("last_event_name", rawVariants)
    : query.eq("last_event_name", rawVariants[0]);
}

function getStatusBadgeStyle(status: unknown): {
  backgroundColor: string;
  color: string;
  border: string;
} {
  const normalized = toExtensivStatusKey(status);
  if (["cancelled", "canceled"].includes(normalized)) {
    return {
      backgroundColor: "rgba(239, 68, 68, 0.14)",
      color: "#b91c1c",
      border: "1px solid rgba(239, 68, 68, 0.6)",
    };
  }

  const stage = getStatusStage(status);
  const palette = LIFECYCLE_STAGE_COLORS[stage] ?? LIFECYCLE_STAGE_COLORS.other;
  return {
    backgroundColor: palette.chipBg,
    color: palette.textColor,
    border: `1px solid ${palette.barColor}`,
  };
}

function formatOrderTotal(value: unknown): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function getExtensivGrandTotal(row: any): number | null {
  const toNumber = (value: any): number | null => {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };

  // If the backend starts storing totals directly, prefer that.
  const direct = toNumber(row?.grand_total ?? row?.total_amount ?? row?.total);
  if (direct !== null) return direct;

  // Fallback: derive from raw_data.billing.billingCharges subtotals
  let raw = row?.raw_data as any;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch (error) {
      raw = null;
    }
  }

  const pickChargesArray = (): any[] | null => {
    if (Array.isArray(raw?.billing?.billingCharges))
      return raw.billing.billingCharges;
    if (Array.isArray(raw?.billingCharges)) return raw.billingCharges;
    if (Array.isArray(raw?.charges)) return raw.charges;
    return null;
  };

  const charges = pickChargesArray();
  if (!charges) return null;

  const total = charges.reduce((acc: number, charge: any) => {
    const subtotal = toNumber(charge?.subtotal);
    if (subtotal !== null) return acc + subtotal;

    const detailsTotal = Array.isArray(charge?.details)
      ? charge.details.reduce((innerAcc: number, detail: any) => {
        const detailSubtotal = toNumber(detail?.subtotal);
        if (detailSubtotal !== null) return innerAcc + detailSubtotal;

        const perUnit = toNumber(detail?.chargePerUnit);
        const units = toNumber(detail?.numUnits) ?? 1;
        if (perUnit !== null && units > 0) return innerAcc + perUnit * units;
        return innerAcc;
      }, 0)
      : 0;

    return acc + detailsTotal;
  }, 0);

  return Number.isFinite(total) ? total : null;
}

function getMarketplaceLogoSrc(
  name: unknown,
  orderMarketplaceId?: unknown,
): string {
  const marketplaceId = String(orderMarketplaceId ?? "").trim();
  if (marketplaceId.toUpperCase().startsWith("SYNC-AI-")) {
    return "/sync-ai-thumb.png";
  }

  const normalized = String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  if (!normalized) return MARKETPLACE_LOGOS.unknown;
  return MARKETPLACE_LOGOS[normalized] ?? MARKETPLACE_LOGOS.unknown;
}

function normalizeOrderRow(row: any, sourceMode: "standard" | "extensiv" | "magaya" | "sellercloud",) {
  if (sourceMode === "extensiv") {
    const grandTotal = getExtensivGrandTotal(row);
    return {
      extensiv_order_id: row.id,
      order_uuid: row.external_id ?? String(row.id),
      order_id: row.external_id ?? row.order_number ?? String(row.id),
      order_source_order_id: row.order_number ?? row.external_id ?? "—",
      client_name: row.customer_name ?? "—",
      grand_total: grandTotal,
      order_date: row.creation_date ?? row.process_date ?? null,
      order_status: row.last_event_name
        ? normalizeExtensivStatus(row.last_event_name, {
          statusFullyAllocated: row.status_fully_allocated,
        })
        : row.status_closed === true
          ? "Shipped"
          : "—",
      source: (row.source || "extensiv") as string,
      marketplace_name: row.facility_name ?? "extensiv",
      warehouse_name: row.facility_name ?? "—",
      channel_account_id: row.account_id_channel ?? null,
      last_event_name: row.last_event_name ?? null,
      status_fully_allocated: row.status_fully_allocated ?? null,
      raw_data: row.raw_data ?? null,
      items: Array.isArray(row.items) ? row.items : [],
      metadata: row.metadata ?? null,
    };
  }

  if (sourceMode === "magaya") {
    return {
      magaya_order_id: row.id,
      order_uuid: String(row.id),
      order_id: row.external_id ?? row.order_number ?? String(row.id),
      order_source_order_id: row.order_number ?? row.external_id ?? "—",
      client_name: row.customer_name ?? "—",
      grand_total: row.grand_total ?? null,
      order_date: row.order_date ?? row.process_date ?? row.ship_date ?? null,
      order_status: String(row.status ?? "").trim() || "—",
      source: "magaya",
      marketplace_name: "magaya",
      warehouse_name: null,
      channel_account_id: null,
      raw_data: row.raw_data ?? null,
      metadata: row.metadata ?? null,
    };
  }

  if (sourceMode === "sellercloud") {
    return {
      order_uuid: row.id ?? row.order_uuid ?? row.order_id ?? null,
      order_id: row.order_id ?? row.order_source_order_id ?? "—",
      order_source_order_id:
        row.order_source_order_id ?? row.external_id ?? row.order_uuid ?? "—",
      client_name: row.client_name ?? "—",
      grand_total: row.grand_total ?? row.total ?? null,
      order_date: row.order_date ?? row.process_date ?? null,
      order_status: row.shipping_status ?? row.status ?? "—",
      source: "sellercloud",
      marketplace_name:
        row.marketplace_name ?? row.marketplace ?? "sellercloud",
      warehouse_name: row.marketplace_name ?? row.marketplace ?? null,
      channel_account_id: row.channel_account_id ?? row.account_id ?? null,
      raw_data: row.raw_data ?? null,
      metadata: row.metadata ?? null,
    };
  }

  return row;
}

function OrderProgress({ status, show }: { status: unknown; show: boolean }) {
  if (!show) {
    return <span className="text-gray-400">—</span>;
  }

  const normalizedStatus = normalizeExtensivStatus(status);
  const progressStatus = normalizedStatus === PARTIAL_ALLOCATED_STATUS ? "Allocated" : normalizedStatus;
  const currentStepIndex = EXTENSIV_STATUS_ORDER.indexOf(progressStatus as (typeof EXTENSIV_STATUS_ORDER)[number],);

  if (currentStepIndex < 0) {
    return <span className="text-gray-400">—</span>;
  }

  const iconForStep = (step: (typeof EXTENSIV_STATUS_ORDER)[number]) => {
    if (step === "Created") return Circle;
    if (step === "Allocated") return CheckCircle2;
    if (step === "Picked") return PackageCheck;
    if (step === "Packed") return Package;
    return Truck;
  };

  return (
    <div className="flex items-center gap-1">
      {EXTENSIV_STATUS_ORDER.map((step, index) => {
        const isDone = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const Icon = iconForStep(step);
        const stepStage = EXTENSIV_STEP_TO_STAGE[step];
        const stepPalette = LIFECYCLE_STAGE_COLORS[stepStage];
        const currentPalette =
          isCurrent && normalizedStatus === PARTIAL_ALLOCATED_STATUS
            ? LIFECYCLE_STAGE_COLORS.partial_allocated
            : stepPalette;
        const iconColor = isDone
          ? stepPalette.textColor
          : isCurrent
            ? currentPalette.textColor
            : "#d1d5db";
        const connectorColor =
          index < currentStepIndex ? stepPalette.barColor : "#e5e7eb";

        return (
          <div key={step} className="flex items-center gap-1">
            <span title={EXTENSIV_STATUS_LABEL[step]}>
              <Icon className="h-4 w-4" style={{ color: iconColor }} />
            </span>
            {index < EXTENSIV_STATUS_ORDER.length - 1 ? (
              <span
                className="h-[2px] w-3 rounded"
                style={{ backgroundColor: connectorColor }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default function OrdersClient({ userId, isParentOnlyExtensiv = false, isParentOnlyMagaya = false, }: { userId: string; isParentOnlyExtensiv?: boolean; isParentOnlyMagaya?: boolean; }) {
  const supabase = useSupabase();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [allStatusOptions, setAllStatusOptions] = useState<string[]>([]);
  const [allWarehouseOptions, setAllWarehouseOptions] = useState<string[]>([]);
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [sourceOverride, setSourceOverride] = useState<"auto" | "sellercloud" | "extensiv" | "magaya">("extensiv");

  const initialSearchTerm = String(searchParams.get("q") ?? "").trim();
  const initialStatusFilter = (() => {
    const raw = String(searchParams.get("status") ?? "").trim();
    if (!raw) return null;
    return normalizeExtensivStatus(raw) || raw;
  })();
  const initialWarehouseFilter =
    String(searchParams.get("warehouse") ?? "").trim() || "all";
  const initialStartDate = parseQueryDate(searchParams.get("start"));
  const initialEndDate = parseQueryDate(searchParams.get("end"));
  const hasDateRangeInQuery = Boolean(initialStartDate || initialEndDate);
  const initialRangeRef = useRef<DateRange>(
    buildDefaultOrdersRange(isParentOnlyExtensiv || isParentOnlyMagaya),
  );
  const hasUserAdjustedRangeRef = useRef(false);
  const hasAppliedSourceDefaultRangeRef = useRef(false);

  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [statusFilter, setStatusFilter] = useState<string | null>(
    initialStatusFilter,
  );
  const [warehouseFilter, setWarehouseFilter] = useState<string>(
    initialWarehouseFilter,
  );
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(
    () => ({
      from: initialStartDate ?? initialRangeRef.current.from,
      to: initialEndDate ?? initialRangeRef.current.to,
    }),
  );
  const startDate = toISODateFromCalendar(selectedRange?.from);
  const endDate = toISODateFromCalendar(selectedRange?.to);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const statusDropdownOptions = (() => {
    const options = ["All status", ...allStatusOptions];
    if (statusFilter && !options.includes(statusFilter)) {
      options.push(statusFilter);
    }
    return Array.from(new Set(options));
  })();
  const sourceValue = sourceOverride === "auto" ? "all" : sourceOverride;
  const isExtensivView = sourceValue === "extensiv";
  const isMagayaView = sourceValue === "magaya";
  const isSellercloudView = sourceValue === "sellercloud";
  const isOperationalView = isExtensivView || isMagayaView;
  const allLocationOption = isExtensivView
    ? "All warehouses"
    : isMagayaView
      ? "All customers"
      : "All marketplaces";
  const locationLabel = isExtensivView
    ? "Warehouse"
    : isMagayaView
      ? "Customer"
      : "Marketplace";

  const applyMagayaAccountScope = (query: any, accountIds: string[]) => {
    if (accountIds.length > 1) return query.in("account_id", accountIds);
    return query.eq("account_id", accountIds[0] ?? "");
  };

  const [viewOperation, setViewOperation] = useState({ show: false, details: null })

  useEffect(() => {
    async function fetchData() {
      const { data: userRecord } = await supabase.from("users").select("account_id, role").eq("id", userId).maybeSingle();

      if (!userRecord) return;

      const userAccountId = userRecord.account_id;
      if (!userAccountId) return;

      setAccountId(userAccountId);
      setUserRole(userRecord.role);

      // Load account integrations for dropdown
      const { data: integrations } = await supabase.from("account_integrations").select("type,status").eq("account_id", userAccountId);

      const integrationTypes = new Set((integrations || []).map((r: any) => String(r?.type ?? "").trim().toLowerCase(),).filter(Boolean),);
      setAvailableSources(Array.from(integrationTypes));

      if (!hasDateRangeInQuery && !hasUserAdjustedRangeRef.current && !hasAppliedSourceDefaultRangeRef.current) {
        const defaultRange = buildDefaultOrdersRange(sourceOverride === "extensiv" || sourceOverride === "magaya",);
        const defaultStart = toISODateFromCalendar(defaultRange.from), defaultEnd = toISODateFromCalendar(defaultRange.to);

        hasAppliedSourceDefaultRangeRef.current = true;

        if (startDate !== defaultStart || endDate !== defaultEnd) {
          setSelectedRange(defaultRange);
          setCurrentPage(1);
          return;
        }
      }

      // Unified fetch through /api/orders/list for any source
      try {
        const params = new URLSearchParams({ page: String(currentPage), pageSize: String(itemsPerPage), source: sourceOverride === "auto" ? "all" : sourceOverride, });

        if (statusFilter) params.set("status", statusFilter);
        if (searchTerm.trim()) params.set("search", searchTerm.trim());
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);

        const response = await fetch(`/api/orders/list?${params.toString()}`, { credentials: "include", cache: "no-store" }).then((res) => res.json()).catch(() => null);

        if (!response) return

        const orders: any[] = Array.isArray(response?.rows) ? response.rows : [];

        // const normalized = rows.map((row) => ({
        //   ...row,
        //   order_uuid: row.order_uuid ?? row.id ?? row.order_id ?? row.order_source_order_id ?? row.external_id,
        //   warehouse_name:
        //     row.warehouse_name ?? row.marketplace_name ?? row.source ?? "—",
        // }));

        // const filteredByWarehouse =
        //   warehouseFilter === "all"
        //     ? normalized
        //     : normalized.filter(
        //       (row) =>
        //         String(row.warehouse_name || "").toLowerCase() ===
        //         String(warehouseFilter).toLowerCase(),
        //     );

        // const statusOptions = Array.isArray(json?.statuses)
        //   ? json.statuses
        //   : [];
        // if (statusOptions.length) setAllStatusOptions(statusOptions);

        // const warehouses = Array.from(
        //   new Set(
        //     normalized
        //       .map((row) => row.warehouse_name)
        //       .filter((val): val is string => Boolean(val)),
        //   ),
        // ).sort((a, b) => a.localeCompare(b));
        // setAllWarehouseOptions(warehouses);

        setOrders(orders);
        setTotalCount(response?.totalCount ?? 0);
      } catch (error) {
        console.error("❌ Unexpected orders fetch error:", error);
      }
    }

    fetchData();
  }, [userId, currentPage, itemsPerPage, supabase, warehouseFilter, statusFilter, startDate, endDate, searchTerm, isParentOnlyExtensiv, isParentOnlyMagaya, hasDateRangeInQuery, sourceOverride,]);

  useEffect(() => {
    hasUserAdjustedRangeRef.current = true;
  }, [selectedRange]);

  const exportAllOrdersToCSV = async (filename = "orders.csv") => {
    setIsExporting(true);
    try {
      const sourceMode: "standard" | "extensiv" | "magaya" | "sellercloud" =
        isExtensivView
          ? "extensiv"
          : isMagayaView
            ? "magaya"
            : isSellercloudView
              ? "sellercloud"
              : "standard";

      const ordersTable =
        sourceMode === "extensiv"
          ? "extensiv_orders"
          : sourceMode === "magaya"
            ? "ai_orders_unified_6"
            : sourceMode === "sellercloud"
              ? "sellercloud_orders"
              : "ai_orders_unified_6";
      const orderDateField =
        sourceMode === "extensiv"
          ? "creation_date"
          : sourceMode === "magaya"
            ? "order_date"
            : sourceMode === "sellercloud"
              ? "order_date"
              : "order_date";
      const warehouseField =
        sourceMode === "extensiv"
          ? "facility_name"
          : sourceMode === "magaya"
            ? "customer_name"
            : sourceMode === "sellercloud"
              ? null
              : "marketplace_name";
      const statusField =
        sourceMode === "extensiv"
          ? "last_event_name"
          : sourceMode === "magaya"
            ? "status"
            : sourceMode === "sellercloud"
              ? "status"
              : "order_status";
      const statusSelect =
        sourceMode === "extensiv"
          ? "last_event_name,status_closed,status_fully_allocated"
          : statusField;
      const statusFilterField =
        sourceMode === "magaya"
          ? "account_id"
          : userRole === "client" || userRole === "staff-client"
            ? sourceMode === "extensiv"
              ? "account_id_channel"
              : "channel_account_id"
            : "account_id";
      let extensivStatusFilterMap: Record<string, string[]> = {};

      let statusQuery: any =
        sourceMode === "magaya"
          ? (supabase as any).from("v_magaya_orders")
          : (supabase as any).from(ordersTable);
      statusQuery =
        sourceMode === "magaya"
          ? applyMagayaAccountScope(statusQuery.select(statusSelect), [
            accountId || "",
          ])
          : statusQuery.select(statusSelect).eq(statusFilterField, accountId);

      const { data: statusRows } = await statusQuery;
      if (sourceMode === "extensiv" && statusRows) {
        const extensivStatuses = (statusRows || [])
          .map((row: any) => {
            const rawEvent = row?.last_event_name;
            if (
              rawEvent !== null &&
              rawEvent !== undefined &&
              String(rawEvent).trim()
            ) {
              return {
                raw: String(rawEvent),
                canonical: normalizeExtensivStatus(rawEvent, {
                  statusFullyAllocated: row?.status_fully_allocated,
                }),
              };
            }

            if (row?.status_closed === true) {
              return {
                raw: "Shipped",
                canonical: "Shipped",
              };
            }

            return null;
          })
          .filter(Boolean) as Array<{ raw: string; canonical: string }>;

        const rawByCanonical = new Map<string, Set<string>>();
        for (const statusRow of extensivStatuses) {
          const canonical = statusRow.canonical;
          if (!canonical) continue;
          if (!rawByCanonical.has(canonical)) {
            rawByCanonical.set(canonical, new Set<string>());
          }
          rawByCanonical.get(canonical)!.add(String(statusRow.raw));
        }

        extensivStatusFilterMap = Object.fromEntries(
          Array.from(rawByCanonical.entries()).map(([canonical, rawSet]) => [
            canonical,
            Array.from(rawSet),
          ]),
        );
      }

      const orderSelectColumns =
        sourceMode === "extensiv"
          ? "id, account_id, account_id_channel, external_id, order_number, customer_name, facility_name, status, status_closed, status_fully_allocated, last_event_name, source, creation_date, process_date, tracking_number, raw_data"
          : sourceMode === "magaya"
            ? "id, account_id, channel_id, external_id, order_number, customer_external_id, customer_name, status, order_date, process_date, ship_date, currency_code, grand_total, tracking_number"
            : sourceMode === "sellercloud"
              ? "id, account_id, order_id, order_source_order_id, client_name, grand_total, order_date, shipping_status, channel_account_id"
              : "order_uuid, order_id, order_source_order_id, client_name, grand_total, order_date, status_code, shipping_status, payment_status, order_status, source, marketplace_name, channel_account_id";

      let query: any = (
        sourceMode === "magaya"
          ? (supabase as any).from("v_magaya_orders")
          : (supabase as any).from(ordersTable)
      ).select(orderSelectColumns);

      if (sourceMode === "magaya") {
        query = applyMagayaAccountScope(query, [accountId || ""]);
      } else if (sourceMode === "sellercloud") {
        query = query.eq("account_id", accountId);
      } else if (userRole === "client" || userRole === "staff-client") {
        query = query.eq(
          sourceMode === "extensiv"
            ? "account_id_channel"
            : "channel_account_id",
          accountId,
        );
      } else {
        query = query.eq("account_id", accountId);
      }

      if (warehouseFilter !== "all") {
        query = query.eq(warehouseField, warehouseFilter);
      }

      if (statusFilter) {
        if (sourceMode === "extensiv") {
          query = applyExtensivStatusFilter(
            query,
            statusFilter,
            extensivStatusFilterMap,
          );
        } else if (sourceMode === "magaya") {
          query = query.eq("status", statusFilter);
        } else if (sourceMode === "sellercloud") {
          query = query.eq("status", statusFilter);
        } else {
          query = query.eq("order_status", statusFilter);
        }
      }

      if (startDate) {
        query = query.gte(
          orderDateField,
          sourceMode === "extensiv" ||
            sourceMode === "magaya" ||
            sourceMode === "sellercloud"
            ? `${startDate}T00:00:00Z`
            : startDate,
        );
      }

      if (endDate) {
        query = query[
          sourceMode === "extensiv" ||
            sourceMode === "magaya" ||
            sourceMode === "sellercloud"
            ? "lte"
            : "lt"
        ](
          orderDateField,
          sourceMode === "extensiv" ||
            sourceMode === "magaya" ||
            sourceMode === "sellercloud"
            ? `${endDate}T23:59:59.999Z`
            : addDaysToISODate(endDate, 1),
        );
      }

      const { data, error } = await query;
      if (error) {
        console.error("❌ Error exporting orders:", error.message);
        return;
      }

      const normalizedOrders = (data || []).map((row: any) =>
        normalizeOrderRow(row, sourceMode),
      );

      if (!normalizedOrders.length) {
        console.warn("No orders to export");
        return;
      }

      const csv = [
        Object.keys(normalizedOrders[0]).join(","),
        ...normalizedOrders.map((row) =>
          Object.values(row)
            .map((val) => {
              if (val === null || val === undefined) return "";
              const str = String(val).replace(/"/g, '""');
              return `"${str}"`;
            })
            .join(","),
        ),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-primary">Orders</h1>
        <div className="flex gap-4 items-center">
          {availableSources.length > 1 && (
            <select
              className="border rounded-md px-2 py-1 text-sm"
              value={sourceOverride}
              onChange={(e) => {
                const val = e.target.value as typeof sourceOverride;
                setSourceOverride(val);
                setCurrentPage(1);
              }}
            >
              <option value="auto">All sources</option>
              {availableSources.includes("sellercloud") && (
                <option value="sellercloud">Sellercloud</option>
              )}
              {availableSources.includes("extensiv") && (
                <option value="extensiv">Extensiv</option>
              )}
              {availableSources.includes("magaya") && (
                <option value="magaya">Magaya</option>
              )}
            </select>
          )}
          <DateRangePicker
            date={selectedRange}
            setDate={(range) => {
              setSelectedRange(range ?? undefined);
              setCurrentPage(1);
              hasUserAdjustedRangeRef.current = true;
            }}
          />
          {accountId && (
            <SyncOrdersButton
              accountId={accountId}
              onImported={() => setCurrentPage(1)}
            />
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={isExporting}
            onClick={() => exportAllOrdersToCSV("orders.csv")}
          >
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
        </div>
      </div>

      <FilterBar
        title="Unified Orders"
        placeholder={
          userRole === "client" || userRole === "staff-client"
            ? "Search by Order ID or Marketplace"
            : "Search by Order ID, Client, or Marketplace"
        }
        searchTerm={searchTerm}
        onSearch={setSearchTerm}
        totalCount={totalCount}
        filteredCount={orders.length}
        onReset={() => {
          setSearchTerm("");
          setStatusFilter(null);
          setWarehouseFilter("all");
        }}
        filters={[
          {
            label: locationLabel,
            value: warehouseFilter,
            options: [allLocationOption, ...allWarehouseOptions],
            onChange: (v: string) => {
              const normalized = v === allLocationOption ? "all" : v;
              setWarehouseFilter(normalized);
              setCurrentPage(1);
            },
          },
          {
            label: "Status",
            value: statusFilter ?? "all",
            options: statusDropdownOptions,
            onChange: (v: string) => {
              const normalized = v === "All status" ? null : v;
              setStatusFilter(normalized);
              setCurrentPage(1);
            },
          },
        ]}
      />

      <div className="flex items-center justify-end gap-4 mb-0 mt-2 text-sm">
        <span>Show:</span>
        {[10, 25, 50].map((count) => (
          <button
            key={count}
            className={`px-1 py-1 rounded ${itemsPerPage === count
              ? "bg-primary/10 text-primary font-bold"
              : "text-gray-600"
              }`}
            onClick={() => {
              setItemsPerPage(count);
              setCurrentPage(1);
            }}
          >
            {count}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-sm mt-4">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="py-3 px-4 text-left font-medium">Order ID</th>
              <th className="py-3 px-4 text-left font-medium">Provider</th>
              <th className="py-3 px-4 text-left font-medium">Warehouse</th>
              {/* <th className="py-3 px-4 text-left font-medium">{isExtensivView ? "Warehouse" : isMagayaView ? "Customer" : "Marketplace"}</th> */}
              <th className="py-3 px-4 text-left font-medium">Order Marketplace ID</th>
              <th className="py-3 px-4 text-left font-medium">Order Date</th>
              <th className="py-3 px-4 text-left font-medium">Status</th>
              {isExtensivView && <th className="py-3 px-4 text-left font-medium">Progress</th>}
              <th className="py-3 px-4 text-left font-medium">Total</th>
              <th className="py-3 px-4 text-left font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {
              orders.map((element, index) => (
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
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium" style={getStatusBadgeStyle(element?.orders?.status)}>
                        {element?.orders?.status}
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
                        <OrderProgress
                          status={element?.orders?.shipping_status}
                          show={true}
                        />
                      ) : (
                        <SellerCloudOrderProgress
                          statusCode={element?.orders?.status}
                          paymentStatus={element?.orders?.payment_status}
                          shipmentStatus={element?.orders?.shipment_status}
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

        <div className="flex justify-between items-center p-4 text-sm">
          <span className="text-gray-600">
            Showing {itemsPerPage * (currentPage - 1) + 1} -{" "}
            {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
          </span>
          <div className="space-x-2">
            <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage == 1} className="px-3 py-1 border rounded disabled:opacity-50">
              Prev
            </button>
            <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage == totalPages} className="px-3 py-1 border rounded disabled:opacity-50">
              Next
            </button>
          </div>
        </div>
      </div>

      <OrderDetailsSc
        order={selectedOrder}
        open={modalOpen}
        onCloseAction={() => setModalOpen(false)}
      />
    </div>
  );
}
