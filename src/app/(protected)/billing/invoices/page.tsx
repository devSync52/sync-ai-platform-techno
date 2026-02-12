"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface InvoiceRow {
  id: string;
  number: string | null;
  plan: {
    name: string | null;
    interval: string | null;
    amount: number | null;
    currency: string | null;
  };
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  status: string;
  createdAt: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  dueDate: string | null;
  downloadUrl: string | null;
  payUrl: string | null;
  receiptUrl: string | null;
  isPaid: boolean;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
}

interface PlanInfo {
  id: string;
  name: string;
  amount: number;
  interval: string | null;
  currency: string;
}

interface UpcomingDowngradeInfo extends PlanInfo {
  effectiveAt: string | null;
}

interface UpcomingCancellationInfo {
  effectiveAt: string | null;
}

function formatCurrency(v: number, currency = "USD") {
  return v.toLocaleString("en-US", { style: "currency", currency });
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US");
}

function formatPeriod(start: string | null, end: string | null) {
  const s = formatDate(start);
  const e = formatDate(end);
  if (s === "-" && e === "-") return "-";
  if (s !== "-" && e === "-") return s;
  if (s === "-" && e !== "-") return e;
  return `${s} - ${e}`;
}

function statusBadge(status: string) {
  const normalized = status.toLowerCase();

  const map: Record<
    string,
    "outline" | "default" | "destructive" | "secondary"
  > = {
    draft: "outline",
    open: "default",
    issued: "default",
    uncollectible: "destructive",
    overdue: "destructive",
    paid: "secondary",
    void: "secondary",
  };

  const variant = map[normalized] ?? "outline";

  return (
    <Badge variant={variant} className="capitalize">
      {normalized}
    </Badge>
  );
}

export default function InvoicesPage() {
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [upcomingDowngrade, setUpcomingDowngrade] =
    useState<UpcomingDowngradeInfo | null>(null);
  const [upcomingCancellation, setUpcomingCancellation] =
    useState<UpcomingCancellationInfo | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancelingDowngrade, setCancelingDowngrade] = useState(false);
  const [cancelingPlan, setCancelingPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestPlanInvoice =
    invoices.find(
      (row) =>
        !!(row.periodStart || row.periodEnd) &&
        (!!plan?.name ? row.plan.name === plan.name : true),
    ) ??
    invoices.find((row) => !!(row.periodStart || row.periodEnd)) ??
    null;

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/stripe/invoices", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to load invoices");
        }

        const payload: {
          plan: PlanInfo | null;
          upcomingDowngrade: UpcomingDowngradeInfo | null;
          upcomingCancellation: UpcomingCancellationInfo | null;
          data: InvoiceRow[];
        } = await res.json();
        if (!active) return;

        setPlan(payload.plan ?? null);
        setUpcomingDowngrade(payload.upcomingDowngrade ?? null);
        setUpcomingCancellation(payload.upcomingCancellation ?? null);
        setInvoices(payload.data ?? []);
      } catch (err) {
        console.error("[stripe/invoices] load error:", err);
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to load invoices",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const handleCancelDowngrade = async () => {
    try {
      setCancelingDowngrade(true);
      const res = await fetch("/api/stripe/downgrade/cancel", {
        method: "POST",
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to cancel downgrade");
      }

      setUpcomingDowngrade(null);
      alert(payload?.message || "Scheduled downgrade canceled");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cancel downgrade");
    } finally {
      setCancelingDowngrade(false);
    }
  };

  const handleCancelPlan = async () => {
    const confirmed = window.confirm(
      "Cancel your current plan at the end of this billing period?",
    );
    if (!confirmed) return;

    try {
      setCancelingPlan(true);
      const res = await fetch("/api/stripe/subscription/cancel", {
        method: "POST",
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to cancel plan");
      }

      setUpcomingCancellation({
        effectiveAt: payload?.effectiveAt ?? null,
      });
      alert(payload?.message || "Plan cancellation scheduled");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cancel plan");
    } finally {
      setCancelingPlan(false);
    }
  };

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Subscription invoices from your selected pricing plan.
          </p>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium">Current Plan</div>
          <div className="flex items-center gap-2">
            {upcomingCancellation ? (
              <Button size="sm" variant="default" disabled>
                Upgrade Plan
              </Button>
            ) : (
              <Link href="/billing/pricing?intent=upgrade&from=invoices">
                <Button size="sm" variant="default">
                  Upgrade Plan
                </Button>
              </Link>
            )}
            {/* <Link href="/billing/pricing?intent=downgrade&from=invoices">
              <Button size="sm" variant="outline">
                Downgrade Plan
              </Button>
            </Link> */}
            <Button
              size="sm"
              variant="destructive"
              onClick={handleCancelPlan}
              disabled={cancelingPlan || !!upcomingCancellation}
            >
              {cancelingPlan
                ? "Canceling..."
                : upcomingCancellation
                  ? "Cancellation scheduled"
                  : "Cancel plan"}
            </Button>
          </div>
        </div>
        {!plan && (
          <div className="pt-2 text-sm text-muted-foreground">
            No active plan found.
          </div>
        )}
        {plan && (
          <div className="pt-2 space-y-1 text-sm text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">{plan.name}</span>
              {" · "}
              {formatCurrency(plan.amount, plan.currency)} /{" "}
              {plan.interval ?? "month"}
            </div>
            <div>
              Duration:{" "}
              {formatPeriod(
                latestPlanInvoice?.periodStart ?? null,
                latestPlanInvoice?.periodEnd ?? null,
              )}
            </div>
            {upcomingDowngrade && (
              <div className="flex items-center justify-between gap-2">
                <div>
                  Upcoming downgrade to{" "}
                  <span className="font-medium text-foreground">
                    {upcomingDowngrade.name}
                  </span>
                  {" · "}
                  {formatCurrency(
                    upcomingDowngrade.amount,
                    upcomingDowngrade.currency,
                  )}{" "}
                  / {upcomingDowngrade.interval ?? "month"}
                  {" · "}
                  Effective {formatDate(upcomingDowngrade.effectiveAt)}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelDowngrade}
                  disabled={cancelingDowngrade}
                >
                  {cancelingDowngrade ? "Canceling..." : "Cancel downgrade"}
                </Button>
              </div>
            )}
            {upcomingCancellation && (
              <div>
                Plan cancellation scheduled for{" "}
                {formatDate(upcomingCancellation.effectiveAt)}
              </div>
            )}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium">Invoice List</div>
        </div>

        {loading && (
          <div className="py-4 text-sm text-muted-foreground">
            Loading invoices…
          </div>
        )}

        {error && !loading && (
          <div className="py-4 text-sm text-destructive">
            Unable to load invoices: {error}
          </div>
        )}

        {!loading && !error && invoices.length === 0 && (
          <div className="py-4 text-sm text-muted-foreground">
            No invoices found yet.
          </div>
        )}

        {!loading && !error && invoices.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground">
                <tr className="border-b text-left">
                  <th className="py-2 pr-3">Invoice #</th>
                  <th className="py-2 pr-3">Plan</th>
                  <th className="py-2 pr-3">Period</th>
                  <th className="py-2 pr-3">Created</th>
                  {/* <th className="py-2 pr-3">Due Date</th> */}
                  <th className="py-2 pr-3">Subtotal</th>
                  {/* <th className="py-2 pr-3">Tax</th> */}
                  <th className="py-2 pr-3">Total</th>
                  <th className="py-2 pr-3">Paid</th>
                  {/* <th className="py-2 pr-3">Due</th> */}
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-medium">
                      {row.number ?? row.id}
                    </td>
                    <td className="py-2 pr-3">
                      {row.plan.name ?? "-"}
                      {row.plan.interval ? ` (${row.plan.interval})` : ""}
                    </td>
                    <td className="py-2 pr-3">
                      {formatPeriod(row.periodStart, row.periodEnd)}
                    </td>
                    <td className="py-2 pr-3">{formatDate(row.createdAt)}</td>
                    {/* <td className="py-2 pr-3">{formatDate(row.dueDate)}</td> */}
                    <td className="py-2 pr-3">
                      {formatCurrency(row.subtotal ?? 0, row.currency)}
                    </td>
                    {/* <td className="py-2 pr-3">
                      {formatCurrency(row.tax ?? 0, row.currency)}
                    </td> */}
                    <td className="py-2 pr-3">
                      {formatCurrency(row.total ?? 0, row.currency)}
                    </td>
                    <td className="py-2 pr-3">
                      {formatCurrency(row.amountPaid ?? 0, row.currency)}
                    </td>
                    {/* <td className="py-2 pr-3">
                      {formatCurrency(
                        row.status.toLowerCase() === "paid"
                          ? 0
                          : (row.amountDue ?? 0),
                        row.currency,
                      )}
                    </td> */}
                    <td className="py-2 pr-3">{statusBadge(row.status)}</td>
                    <td className="py-2 text-right">
                      <div className="flex justify-end gap-2">
                        {row.receiptUrl && (
                          <a
                            href={row.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Button size="sm" variant="outline">
                              {/* Receipt */}
                              Download
                            </Button>
                          </a>
                        )}
                        {row.downloadUrl ? (
                          <p></p>
                        ) : // <a
                        //   href={row.downloadUrl}
                        //   target="_blank"
                        //   rel="noreferrer"
                        // >
                        //   <Button size="sm" variant="outline">
                        //     Download
                        //   </Button>
                        // </a>
                        row.payUrl ? (
                          <a href={row.payUrl} target="_blank" rel="noreferrer">
                            <Button size="sm" variant="default">
                              Pay now
                            </Button>
                          </a>
                        ) : (
                          <Button size="sm" variant="outline" disabled>
                            Processing
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
