"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

type PaymentMode = "subscription" | "one_time";

type PaymentRow = {
  sessionId: string;
  createdAt: string;
  amountTotal: number;
  currency: string;
  status: string | null;
  paymentStatus: string | null;
  customerEmail: string | null;
  userId: string | null;
  selectedPackage: string | null;
  paymentMode: PaymentMode;
  stripeMode: string;
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  subscriptionCancelAtPeriodEnd: boolean | null;
  subscriptionCurrentPeriodEnd: number | null;
  canCancelSubscription: boolean;
};

type PaymentsResponse = {
  summary: {
    total: number;
    subscriptions: number;
    oneTimePayments: number;
    paidCount: number;
    paidAmountTotal: number;
  };
  subscriptions: PaymentRow[];
  oneTimePayments: PaymentRow[];
  all: PaymentRow[];
};

const gbpFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaymentsResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "subscription" | "one_time">(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : {};
  const isAuthenticated =
    typeof window !== "undefined"
      ? localStorage.getItem("isAuthenticated") === "true"
      : false;

  useEffect(() => {
    if (!isAuthenticated || user.role !== "admin") {
      router.push("/login");
      return;
    }

    const loadPayments = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/admin/payments", { cache: "no-store" });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(payload?.error || "Failed to load payments.");
        }
        setData(payload as PaymentsResponse);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unexpected error");
      } finally {
        setLoading(false);
      }
    };

    void loadPayments();
  }, [isAuthenticated, router, user.role]);

  const currentRows = useMemo(() => {
    if (!data) return [];
    const base =
      activeTab === "subscription"
        ? data.subscriptions
        : activeTab === "one_time"
          ? data.oneTimePayments
          : data.all;

    if (statusFilter === "all") return base;
    if (statusFilter === "paid") {
      return base.filter((item) => item.paymentStatus === "paid");
    }
    if (statusFilter === "open") {
      return base.filter((item) => item.status === "open");
    }
    if (statusFilter === "complete") {
      return base.filter((item) => item.status === "complete");
    }
    if (statusFilter === "expired") {
      return base.filter((item) => item.status === "expired");
    }
    return base;
  }, [activeTab, data, statusFilter]);

  if (!isAuthenticated || user.role !== "admin") return null;

  const cancelSubscription = async (subscriptionId: string) => {
    if (!confirm("Cancel this subscription at period end?")) return;
    try {
      setCancellingId(subscriptionId);
      const res = await fetch("/api/stripe/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to cancel subscription.");
      }

      setData((prev) => {
        if (!prev) return prev;
        const updateRow = (row: PaymentRow) =>
          row.subscriptionId === subscriptionId
            ? {
                ...row,
                subscriptionStatus: payload?.status || row.subscriptionStatus,
                subscriptionCancelAtPeriodEnd:
                  payload?.cancelAtPeriodEnd ?? true,
                subscriptionCurrentPeriodEnd:
                  payload?.currentPeriodEnd ?? row.subscriptionCurrentPeriodEnd,
                canCancelSubscription: false,
              }
            : row;

        return {
          ...prev,
          all: prev.all.map(updateRow),
          subscriptions: prev.subscriptions.map(updateRow),
          oneTimePayments: prev.oneTimePayments.map(updateRow),
        };
      });
    } catch (cancelError) {
      setError(
        cancelError instanceof Error ? cancelError.message : "Unexpected error",
      );
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-stone-50">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl">
          <div className="mb-8">
            <h1 className="mb-2 font-display text-4xl font-bold text-gray-900">
              Payments
            </h1>
            <p className="text-gray-600">
              View Stripe checkouts, subscriptions, and one-time payments.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs uppercase text-gray-500">Total Sessions</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {data?.summary.total ?? 0}
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs uppercase text-gray-500">Subscriptions</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">
                {data?.summary.subscriptions ?? 0}
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs uppercase text-gray-500">One-Time</p>
              <p className="mt-1 text-2xl font-bold text-blue-700">
                {data?.summary.oneTimePayments ?? 0}
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs uppercase text-gray-500">Paid Count</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {data?.summary.paidCount ?? 0}
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs uppercase text-gray-500">Paid Amount</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {gbpFormatter.format((data?.summary.paidAmountTotal ?? 0) / 100)}
              </p>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow-sm md:grid-cols-2">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab("all")}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${activeTab === "all" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab("subscription")}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${activeTab === "subscription" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >
                Subscriptions
              </button>
              <button
                onClick={() => setActiveTab("one_time")}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${activeTab === "one_time" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >
                One-Time
              </button>
            </div>
            <div className="md:justify-self-end">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none md:w-56"
              >
                <option value="all">All statuses</option>
                <option value="paid">Paid only</option>
                <option value="complete">Checkout complete</option>
                <option value="open">Checkout open</option>
                <option value="expired">Checkout expired</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white shadow-md">
            <div className="grid grid-cols-12 gap-4 border-b border-gray-100 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-2">Payment</div>
              <div className="col-span-2">Customer</div>
              <div className="col-span-2">Session</div>
            </div>

            {loading ? (
              <div className="p-10 text-center text-gray-600">Loading payments...</div>
            ) : currentRows.length === 0 ? (
              <div className="p-10 text-center text-gray-600">
                No payment records match current filters.
              </div>
            ) : (
              currentRows.map((item) => (
                <div
                  key={item.sessionId}
                  className="grid grid-cols-12 items-center gap-4 border-b border-gray-100 px-6 py-4 text-sm"
                >
                  <div className="col-span-2 text-gray-700">
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                  <div className="col-span-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${item.paymentMode === "subscription" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}
                    >
                      {item.paymentMode === "subscription"
                        ? "Subscription"
                        : "One-time"}
                    </span>
                    {item.subscriptionStatus && (
                      <p className="mt-1 text-xs text-gray-500">
                        {item.subscriptionCancelAtPeriodEnd
                          ? "Cancellation scheduled"
                          : `Sub: ${item.subscriptionStatus}`}
                      </p>
                    )}
                    {item.subscriptionCancelAtPeriodEnd && item.subscriptionCurrentPeriodEnd && (
                      <p className="mt-1 text-xs text-amber-600">
                        Expiring on {new Date(item.subscriptionCurrentPeriodEnd * 1000).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2 font-semibold text-gray-900">
                    {new Intl.NumberFormat("en-GB", {
                      style: "currency",
                      currency: (item.currency || "gbp").toUpperCase(),
                    }).format((item.amountTotal || 0) / 100)}
                  </div>
                  <div className="col-span-2 text-gray-700">
                    <p>Session: {item.status || "n/a"}</p>
                    <p className="text-xs text-gray-500">
                      Payment: {item.paymentStatus || "n/a"}
                    </p>
                  </div>
                  <div className="col-span-2 text-gray-700">
                    <p className="truncate">{item.customerEmail || "N/A"}</p>
                    <p className="truncate text-xs text-gray-500">
                      User: {item.userId || "N/A"}
                    </p>
                  </div>
                  <div className="col-span-2 text-gray-700">
                    <p className="truncate font-mono text-xs">{item.sessionId}</p>
                    <p className="truncate text-xs text-gray-500">
                      Plan: {item.selectedPackage || "N/A"}
                    </p>
                    {item.canCancelSubscription && item.subscriptionId && (
                      <button
                        type="button"
                        onClick={() => cancelSubscription(item.subscriptionId as string)}
                        disabled={cancellingId === item.subscriptionId}
                        className="mt-2 rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        {cancellingId === item.subscriptionId
                          ? "Cancelling..."
                          : "Cancel Sub"}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
