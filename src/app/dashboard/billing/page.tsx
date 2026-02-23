"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useAuth } from "@/contexts/AuthContext";

type SubscriptionRow = {
  subscriptionId: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: number | null;
  createdAt: string;
  customerEmail: string | null;
  selectedPackage: string | null;
  amountTotal: number;
  currency: string;
  checkoutSessionId: string;
};

export default function BillingPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [items, setItems] = useState<SubscriptionRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || user?.role !== "business_owner") {
      router.push("/login");
      return;
    }

    const loadSubscriptions = async () => {
      try {
        setLoadingData(true);
        setError(null);
        const res = await fetch("/api/stripe/subscriptions/my", {
          cache: "no-store",
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(payload?.error || "Failed to load subscriptions.");
        }
        setItems(
          Array.isArray(payload?.subscriptions) ? payload.subscriptions : [],
        );
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unexpected error");
      } finally {
        setLoadingData(false);
      }
    };

    void loadSubscriptions();
  }, [isAuthenticated, loading, router, user?.role]);

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

      setItems((prev) =>
        prev.map((item) =>
          item.subscriptionId === subscriptionId
            ? {
                ...item,
                status: payload?.status || item.status,
                cancelAtPeriodEnd: Boolean(payload?.cancelAtPeriodEnd ?? true),
                currentPeriodEnd:
                  payload?.currentPeriodEnd ?? item.currentPeriodEnd,
              }
            : item,
        ),
      );
    } catch (cancelError) {
      setError(
        cancelError instanceof Error ? cancelError.message : "Unexpected error",
      );
    } finally {
      setCancellingId(null);
    }
  };

  if (loading || !isAuthenticated || user?.role !== "business_owner") return null;

  return (
    <div className="flex min-h-screen bg-stone-50">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-5xl">
          <div className="mb-8">
            <h1 className="mb-2 font-display text-4xl font-bold text-gray-900">
              Billing
            </h1>
            <p className="text-gray-600">
              Manage your active subscriptions and cancel anytime.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="overflow-hidden rounded-2xl bg-white shadow-md">
            <div className="grid grid-cols-12 gap-4 border-b border-gray-100 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <div className="col-span-2">Started</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-3">Details</div>
              <div className="col-span-3 text-right">Action</div>
            </div>

            {loadingData ? (
              <div className="p-10 text-center text-gray-600">
                Loading subscriptions...
              </div>
            ) : items.length === 0 ? (
              <div className="p-10 text-center text-gray-600">
                No subscriptions found.
              </div>
            ) : (
              items.map((item) => {
                const cancellable =
                  item.status !== "canceled" && !item.cancelAtPeriodEnd;

                return (
                  <div
                    key={item.subscriptionId}
                    className="grid grid-cols-12 items-center gap-4 border-b border-gray-100 px-6 py-4 text-sm"
                  >
                    <div className="col-span-2 text-gray-700">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                    <div className="col-span-2">
                      <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                        {item.cancelAtPeriodEnd ? "Cancellation scheduled" : item.status}
                      </span>
                      {item.cancelAtPeriodEnd && item.currentPeriodEnd && (
                        <p className="mt-1 text-xs text-amber-600">
                          Expiring on {new Date(item.currentPeriodEnd * 1000).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="col-span-2 font-semibold text-gray-900">
                      {new Intl.NumberFormat("en-GB", {
                        style: "currency",
                        currency: (item.currency || "gbp").toUpperCase(),
                      }).format((item.amountTotal || 0) / 100)}
                    </div>
                    <div className="col-span-3 text-gray-700">
                      <p className="truncate">Plan: {item.selectedPackage || "N/A"}</p>
                      <p className="truncate text-xs text-gray-500">
                        {item.customerEmail || "N/A"}
                      </p>
                    </div>
                    <div className="col-span-3 text-right">
                      {cancellable ? (
                        <button
                          type="button"
                          onClick={() => cancelSubscription(item.subscriptionId)}
                          disabled={cancellingId === item.subscriptionId}
                          className="rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          {cancellingId === item.subscriptionId
                            ? "Cancelling..."
                            : "Cancel Subscription"}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500">
                          {item.status === "canceled"
                            ? "Cancelled"
                            : "Cancellation scheduled"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
