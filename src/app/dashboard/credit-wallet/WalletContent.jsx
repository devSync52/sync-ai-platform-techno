"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, CreditCard, Download, FileText, Loader2, Plus, RefreshCw, Wallet } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "react-hot-toast";
import axiosInstance from "@/config/axios";
import { API_URL } from "@/utils/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const quickAmounts = [25, 50, 100, 250];

const emptyWallet = {
  summary: { balance: 0, totalLoaded: 0, totalConsumed: 0 },
  consumptionTrend: [],
  transactions: [],
  pagination: { page: 1, rowCount: 10, total: 0, totalPages: 1 },
};

const formatMoney = (amount, currency = "usd") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: String(currency || "usd").toUpperCase(),
    minimumFractionDigits: 2,
  }).format(Number(amount || 0));
};

const formatDate = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const getStatusTone = (status) => {
  if (status === "paid") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (status === "failed" || status === "canceled") return "bg-red-50 text-red-700 border-red-100";
  return "bg-amber-50 text-amber-700 border-amber-100";
};

const formatChartDate = (value) => {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
};

export default function WalletContent({ initialWallet = emptyWallet }) {
  const [wallet, setWallet] = useState({
    ...emptyWallet,
    ...initialWallet,
    summary: { ...emptyWallet.summary, ...(initialWallet?.summary || {}) },
    pagination: { ...emptyWallet.pagination, ...(initialWallet?.pagination || {}) },
  });
  const [amount, setAmount] = useState("50");
  const [loading, setLoading] = useState(false);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const lowBalance = Number(wallet.summary.balance || 0) < 10;

  const fetchWallet = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(API_URL.WALLET, {
        params: { page, limit: 10 },
      });
      setWallet((current) => response.data?.data || current);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to load wallet");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const cancelled = params.get("top_up");

    if (cancelled === "cancelled") {
      toast.error("Wallet top-up was cancelled");
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (!sessionId) return;

    const syncSession = async () => {
      setSyncing(true);
      try {
        await axiosInstance.post(API_URL.WALLET_CHECKOUT_SESSION_SYNC, { sessionId });
        toast.success("Wallet credits added");
        window.history.replaceState({}, "", window.location.pathname);
        fetchWallet(1);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Unable to confirm wallet top-up");
      } finally {
        setSyncing(false);
      }
    };

    syncSession();
  }, [fetchWallet]);

  const handleTopUp = async () => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount < 1) {
      toast.error("Enter an amount of at least $1.00");
      return;
    }

    setTopUpLoading(true);
    try {
      const response = await axiosInstance.post(API_URL.WALLET_CHECKOUT_SESSION, {
        amount: numericAmount,
        currency: "usd",
      });
      const checkoutUrl = response.data?.data?.url;
      if (!checkoutUrl) throw new Error("Stripe checkout URL is missing");
      window.location.href = checkoutUrl;
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || "Unable to start checkout");
      setTopUpLoading(false);
    }
  };

  const stats = useMemo(() => [
    {
      label: "Available Balance",
      value: formatMoney(wallet.summary.balance),
      icon: Wallet,
      tone: "bg-[#171024] text-white",
      helper: lowBalance ? "Low balance. Top up recommended." : "Ready for label generation.",
    },
    {
      label: "Total Loaded",
      value: formatMoney(wallet.summary.totalLoaded),
      icon: ArrowUpCircle,
      tone: "bg-white text-emerald-700 border border-emerald-100",
      helper: "All-time wallet credits added.",
    },
    {
      label: "Total Consumed",
      value: formatMoney(wallet.summary.totalConsumed),
      icon: ArrowDownCircle,
      tone: "bg-white text-red-600 border border-red-100",
      helper: "All-time credits used.",
    },
  ], [wallet.summary, lowBalance]);

  const consumedTracker = useMemo(() => {
    return (wallet.consumptionTrend || [])
      .sort((firstItem, secondItem) => new Date(firstItem.date) - new Date(secondItem.date))
      .map((item) => ({
        ...item,
        label: formatChartDate(item.date),
        consumed: Number(item.consumed || 0),
      }));
  }, [wallet.consumptionTrend]);

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {lowBalance && (
          <div className="flex flex-col gap-4 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="font-bold">Low credit balance: {formatMoney(wallet.summary.balance)} remaining</p>
                <p className="mt-1 text-sm text-amber-800">Top up your wallet to keep generating labels without interruption.</p>
              </div>
            </div>
            <Button onClick={handleTopUp} disabled={topUpLoading} className="gap-2 bg-amber-700 text-white hover:bg-amber-800">
              {topUpLoading ? <Loader2 className="size-4 animate-spin" /> : <Wallet className="size-4" />}
              Top Up
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-700">Finance</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-950">Credit Wallet</h1>
            <p className="mt-2 text-sm text-gray-600">Load credits with Stripe, review transactions, and download invoices.</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => fetchWallet(wallet.pagination.page)} disabled={loading || syncing}>
            <RefreshCw className={`size-4 ${loading || syncing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={`rounded-lg p-6 shadow-sm ${stat.tone}`}>
                <div className="mb-5 flex size-11 items-center justify-center rounded-lg bg-current/10">
                  <Icon className="size-5" />
                </div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] opacity-75">{stat.label}</p>
                <p className="mt-4 text-4xl font-bold">{stat.value}</p>
                <p className="mt-3 text-sm opacity-75">{stat.helper}</p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
                <Plus className="size-5" />
              </div>
              <div>
                <p className="font-bold text-gray-950">Add credits</p>
                <p className="text-sm text-gray-500">Secure checkout powered by Stripe.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="wallet-amount">Amount</Label>
                <div className="mt-2 flex items-center rounded-lg border border-gray-200 bg-white px-3 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100">
                  <span className="text-sm font-bold text-gray-500">$</span>
                  <Input id="wallet-amount" type="number" min="1" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="border-0 shadow-none focus-visible:ring-0" />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((quickAmount) => (
                  <button key={quickAmount} type="button" onClick={() => setAmount(String(quickAmount))} className={`h-10 rounded-lg border text-sm font-bold transition ${Number(amount) === quickAmount ? "border-purple-600 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-700 hover:border-purple-200 hover:bg-purple-50"}`}>
                    ${quickAmount}
                  </button>
                ))}
              </div>

              <Button onClick={handleTopUp} disabled={topUpLoading || syncing} className="h-11 w-full gap-2 bg-linear-to-r from-purple-600 to-violet-600 text-white hover:opacity-90">
                {topUpLoading ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
                Continue to Stripe
              </Button>

              {syncing && (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                  Confirming your wallet top-up...
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-gray-50 text-gray-700">
                  <FileText className="size-5" />
                </div>
                <div>
                  <p className="font-bold text-gray-950">Transaction history</p>
                  <p className="text-sm text-gray-500">Paid top-ups include invoice download options.</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-500">{wallet.pagination.total || 0} transactions</p>
            </div>

            {loading ? (
              <div className="flex h-72 items-center justify-center text-sm font-semibold text-gray-500">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Loading transactions
              </div>
            ) : wallet.transactions.length === 0 ? (
              <div className="flex h-72 flex-col items-center justify-center px-6 text-center">
                <div className="mb-4 flex size-14 items-center justify-center rounded-lg border border-gray-200 text-gray-400">
                  <CreditCard className="size-6" />
                </div>
                <p className="font-bold text-gray-900">No transactions yet</p>
                <p className="mt-1 text-sm text-gray-500">Add credits to create your first wallet transaction.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 font-bold">Date</th>
                      <th className="px-4 py-3 font-bold">Description</th>
                      <th className="px-4 py-3 font-bold">Type</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3 text-right font-bold">Amount</th>
                      <th className="px-4 py-3 text-right font-bold">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {wallet.transactions.map((transaction) => {
                      const invoiceUrl = transaction.invoicePdf || transaction.hostedInvoiceUrl || transaction.receiptUrl;
                      return (
                        <tr key={transaction.id} className="hover:bg-gray-50/80">
                          <td className="whitespace-nowrap px-4 py-4 text-gray-500">{formatDate(transaction.createdAt)}</td>
                          <td className="px-4 py-4">
                            <p className="font-semibold text-gray-900">{transaction.description || "Wallet transaction"}</p>
                            <p className="mt-1 text-xs text-gray-500">{transaction.stripeInvoiceId || transaction.stripeSessionId || "Manual ledger entry"}</p>
                          </td>
                          <td className="px-4 py-4 font-semibold capitalize text-gray-700">{transaction.type}</td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-bold uppercase ${getStatusTone(transaction.status)}`}>
                              {transaction.status}
                            </span>
                          </td>
                          <td className={`whitespace-nowrap px-4 py-4 text-right font-bold ${transaction.type === "debit" ? "text-red-600" : "text-emerald-700"}`}>
                            {transaction.type === "debit" ? "-" : "+"}{formatMoney(transaction.amount, transaction.currency)}
                          </td>
                          <td className="px-4 py-4 text-right">
                            {invoiceUrl ? (
                              <a href={invoiceUrl} target="_blank" rel="noreferrer" className="inline-flex h-7 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 text-[0.8rem] font-medium text-gray-700 transition hover:bg-gray-50">
                                <Download className="size-4" />
                                Download
                              </a>
                            ) : (
                              <button type="button" disabled className="inline-flex h-7 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 text-[0.8rem] font-medium text-gray-400 opacity-60">
                                <Download className="size-4" />
                                Pending
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-gray-950">Consumed tracker</p>
              <p className="mt-1 text-sm text-gray-500">Daily wallet credit usage from paid debit transactions.</p>
            </div>
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
              {formatMoney(wallet.summary.totalConsumed)} consumed
            </div>
          </div>

          <div className="mt-5 h-72 min-w-0">
            {consumedTracker.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={consumedTracker} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="consumedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eceaf2" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} tickFormatter={(value) => `$${value}`} width={54} />
                  <Tooltip
                    formatter={(value) => [formatMoney(value), "Consumed"]}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.label || "Usage"}
                    contentStyle={{ borderRadius: 8, borderColor: "#e5e7eb", boxShadow: "0 10px 30px rgba(17, 12, 35, 0.08)" }}
                  />
                  <Area type="monotone" dataKey="consumed" stroke="#dc2626" strokeWidth={2.5} fill="url(#consumedGradient)" dot={{ r: 3, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-center">
                <ArrowDownCircle className="mb-3 size-8 text-gray-400" />
                <p className="font-bold text-gray-900">No consumption recorded yet</p>
                <p className="mt-1 text-sm text-gray-500">Wallet usage will appear here after credits are consumed.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
