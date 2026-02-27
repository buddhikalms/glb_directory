"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPackageFeatureLabel,
  normalizePackageFeatures,
} from "@/lib/package-features";
import { getBillingDurationLabel } from "@/lib/pricing-duration";

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

type OwnedBusiness = {
  id: string;
  name: string;
  pricingPackageId?: string | null;
  pricingPackage?: {
    id: string;
    name: string;
  } | null;
};

type PricingPackage = {
  id: string;
  name: string;
  price: number;
  billingPeriod: "monthly" | "yearly";
  durationDays: number;
  description: string;
  features?: unknown;
  active: boolean;
};

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedBusinessId = useMemo(
    () => searchParams.get("businessId") ?? "",
    [searchParams],
  );
  const upgradeSessionId = useMemo(
    () => searchParams.get("upgradeSessionId") ?? "",
    [searchParams],
  );
  const upgradeBusinessId = useMemo(
    () => searchParams.get("businessId") ?? "",
    [searchParams],
  );
  const upgradeSelectedPackage = useMemo(
    () => searchParams.get("selectedPackage") ?? "",
    [searchParams],
  );
  const upgradePaymentMode = useMemo(
    () =>
      searchParams.get("paymentMode") === "one_time"
        ? "one_time"
        : "subscription",
    [searchParams],
  );
  const upgradeCancelled = useMemo(
    () => searchParams.get("upgrade") === "cancelled",
    [searchParams],
  );

  const { user, isAuthenticated, loading } = useAuth();
  const [items, setItems] = useState<SubscriptionRow[]>([]);
  const [businesses, setBusinesses] = useState<OwnedBusiness[]>([]);
  const [pricingPackages, setPricingPackages] = useState<PricingPackage[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState(preselectedBusinessId);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [changingPlan, setChangingPlan] = useState(false);
  const [verifyingUpgrade, setVerifyingUpgrade] = useState(false);

  const loadData = useCallback(
    async (preferredBusinessId?: string) => {
      try {
        setLoadingData(true);
        setError(null);
        const [subRes, businessesRes, packagesRes] = await Promise.all([
          fetch("/api/stripe/subscriptions/my", { cache: "no-store" }),
          fetch("/api/dashboard/owned-businesses", { cache: "no-store" }),
          fetch("/api/pricing", { cache: "no-store" }),
        ]);

        const [subPayload, businessesPayload, packagesPayload] = await Promise.all([
          subRes.json().catch(() => ({})),
          businessesRes.json().catch(() => ({})),
          packagesRes.json().catch(() => ([])),
        ]);

        if (!subRes.ok) {
          throw new Error(subPayload?.error || "Failed to load subscriptions.");
        }
        if (!businessesRes.ok) {
          throw new Error(businessesPayload?.error || "Failed to load listings.");
        }
        if (!packagesRes.ok) {
          throw new Error("Failed to load pricing packages.");
        }

        const subscriptionRows = Array.isArray(subPayload?.subscriptions)
          ? subPayload.subscriptions
          : [];
        const ownedBusinesses = Array.isArray(businessesPayload?.businesses)
          ? businessesPayload.businesses
          : [];
        const activePackages = (Array.isArray(packagesPayload) ? packagesPayload : [])
          .filter((pkg): pkg is PricingPackage => Boolean(pkg?.id && pkg?.active))
          .sort((a, b) => a.price - b.price);

        setItems(subscriptionRows);
        setBusinesses(ownedBusinesses);
        setPricingPackages(activePackages);

        setSelectedBusinessId((current) => {
          if (
            preferredBusinessId &&
            ownedBusinesses.some((item: { id: string }) => item.id === preferredBusinessId)
          ) {
            return preferredBusinessId;
          }
          if (
            current &&
            ownedBusinesses.some((item: { id: string }) => item.id === current)
          ) {
            return current;
          }
          if (
            preselectedBusinessId &&
            ownedBusinesses.some((item: { id: string }) => item.id === preselectedBusinessId)
          ) {
            return preselectedBusinessId;
          }
          return ownedBusinesses[0]?.id || "";
        });
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unexpected error");
      } finally {
        setLoadingData(false);
      }
    },
    [preselectedBusinessId],
  );

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || user?.role !== "business_owner") {
      router.push("/login");
      return;
    }
    void loadData(preselectedBusinessId);
  }, [isAuthenticated, loadData, loading, preselectedBusinessId, router, user?.role]);

  useEffect(() => {
    if (!selectedBusinessId || pricingPackages.length === 0) {
      setSelectedPackageId("");
      return;
    }
    const selectedBusiness = businesses.find((item) => item.id === selectedBusinessId);
    const currentPackageId = selectedBusiness?.pricingPackageId || "";

    setSelectedPackageId((current) => {
      if (
        current &&
        pricingPackages.some((pkg) => pkg.id === current) &&
        current !== currentPackageId
      ) {
        return current;
      }
      const nextPackage =
        pricingPackages.find((pkg) => pkg.id !== currentPackageId) || pricingPackages[0];
      return nextPackage?.id || "";
    });
  }, [businesses, pricingPackages, selectedBusinessId]);

  useEffect(() => {
    if (loading || !isAuthenticated || user?.role !== "business_owner") return;

    if (upgradeCancelled) {
      setError("Upgrade checkout was cancelled.");
      const nextQuery = preselectedBusinessId
        ? `?businessId=${encodeURIComponent(preselectedBusinessId)}`
        : "";
      router.replace(`/dashboard/billing${nextQuery}`);
      return;
    }

    if (!upgradeSessionId || !upgradeBusinessId || !upgradeSelectedPackage) {
      return;
    }

    let disposed = false;
    const verifyUpgrade = async () => {
      try {
        setVerifyingUpgrade(true);
        setError(null);
        const res = await fetch("/api/stripe/verify-upgrade-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: upgradeSessionId,
            businessId: upgradeBusinessId,
            selectedPackage: upgradeSelectedPackage,
            paymentMode: upgradePaymentMode,
          }),
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok || !payload?.ok) {
          throw new Error(payload?.error || "Failed to verify plan upgrade.");
        }

        if (disposed) return;
        setMessage(
          payload?.alreadyUpgraded
            ? "This listing is already on the selected plan."
            : "Plan upgraded successfully.",
        );
        await loadData(upgradeBusinessId);
      } catch (verifyError) {
        if (disposed) return;
        setError(
          verifyError instanceof Error
            ? verifyError.message
            : "Failed to verify plan upgrade.",
        );
      } finally {
        if (disposed) return;
        setVerifyingUpgrade(false);
        const nextQuery = upgradeBusinessId
          ? `?businessId=${encodeURIComponent(upgradeBusinessId)}`
          : "";
        router.replace(`/dashboard/billing${nextQuery}`);
      }
    };

    void verifyUpgrade();
    return () => {
      disposed = true;
    };
  }, [
    isAuthenticated,
    loadData,
    loading,
    preselectedBusinessId,
    router,
    upgradeBusinessId,
    upgradeCancelled,
    upgradePaymentMode,
    upgradeSelectedPackage,
    upgradeSessionId,
    user?.role,
  ]);

  const packageById = useMemo(
    () => new Map<string, PricingPackage>(pricingPackages.map((pkg) => [pkg.id, pkg])),
    [pricingPackages],
  );

  const packageNameById = useMemo(
    () =>
      new Map<string, string>(pricingPackages.map((pkg) => [pkg.id, pkg.name])),
    [pricingPackages],
  );

  const selectedBusiness = useMemo(
    () => businesses.find((item) => item.id === selectedBusinessId) || null,
    [businesses, selectedBusinessId],
  );

  const selectedPackage = useMemo(
    () => pricingPackages.find((item) => item.id === selectedPackageId) || null,
    [pricingPackages, selectedPackageId],
  );

  const currentPackage = useMemo(() => {
    if (!selectedBusiness?.pricingPackageId) return null;
    return packageById.get(selectedBusiness.pricingPackageId) || null;
  }, [packageById, selectedBusiness?.pricingPackageId]);

  const isDowngrade = Boolean(
    selectedBusiness &&
      selectedPackage &&
      currentPackage &&
      selectedPackage.price < currentPackage.price,
  );

  const downgradeToFreeBlocked = Boolean(
    isDowngrade && selectedPackage && selectedPackage.price <= 0,
  );

  const selectedPackageFeatureLabels = useMemo(() => {
    const normalized = normalizePackageFeatures(selectedPackage?.features || []);
    if (normalized.length > 0) {
      return normalized.map((feature) => getPackageFeatureLabel(feature));
    }

    if (Array.isArray(selectedPackage?.features)) {
      return selectedPackage.features
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  }, [selectedPackage?.features]);

  const cancelSubscription = async (subscriptionId: string) => {
    if (!confirm("Cancel this subscription at period end?")) return;
    try {
      setCancellingId(subscriptionId);
      setError(null);
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

  const handleChangePlan = async () => {
    if (!selectedBusinessId) {
      setError("Select a listing first.");
      return;
    }
    if (!selectedPackageId) {
      setError("Select a target plan.");
      return;
    }

    if (downgradeToFreeBlocked) {
      setError("Downgrading to a free plan is not allowed.");
      return;
    }

    if (isDowngrade) {
      const proceed = confirm(
        `You are downgrading from ${currentPackage?.name || "current plan"} to ${
          selectedPackage?.name || "selected plan"
        }.\n\nYour current plan features will stop working immediately, and only features in the downgraded plan will remain active. Continue?`,
      );
      if (!proceed) return;
    }

    try {
      setError(null);
      setMessage(null);
      setChangingPlan(true);

      const res = await fetch("/api/stripe/create-upgrade-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: selectedBusinessId,
          selectedPackage: selectedPackageId,
          paymentMode: "subscription",
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to change plan.");
      }

      if (payload?.downgradeRequested) {
        setMessage(
          payload?.message ||
            "Downgrade request submitted. Waiting for admin decision.",
        );
        await loadData(selectedBusinessId);
        return;
      }

      if (payload?.noPaymentRequired && (payload?.upgraded || payload?.downgraded)) {
        setMessage(payload?.message || "Plan updated successfully.");
        await loadData(selectedBusinessId);
        return;
      }

      if (!payload?.url) {
        throw new Error("Checkout URL was not returned.");
      }
      window.location.href = payload.url;
    } catch (planError) {
      setError(
        planError instanceof Error
          ? planError.message
          : "Failed to change plan.",
      );
    } finally {
      setChangingPlan(false);
    }
  };

  if (loading || !isAuthenticated || user?.role !== "business_owner") return null;

  return (
    <div className="flex min-h-screen bg-stone-50">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl">
          <div className="mb-8">
            <h1 className="mb-2 font-display text-4xl font-bold text-gray-900">
              Billing
            </h1>
            <p className="text-gray-600">
              Upgrade or downgrade listing plans and manage subscriptions.
            </p>
          </div>

          {message && (
            <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <section className="mb-8 rounded-2xl bg-white p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-bold text-gray-900">
                  Change Listing Plan
                </h2>
                <p className="text-sm text-gray-600">
                  Select a listing and plan. Upgrades go to checkout; downgrades apply policy.
                </p>
              </div>
              {verifyingUpgrade && (
                <span className="rounded bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  Verifying upgrade...
                </span>
              )}
            </div>

            <div className="mb-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Listing
                </label>
                <select
                  value={selectedBusinessId}
                  onChange={(e) => setSelectedBusinessId(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">Select listing</option>
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">Current Plan</p>
                <p>
                  {selectedBusiness?.pricingPackage?.name ||
                    (selectedBusiness ? "No active plan" : "Select a listing")}
                </p>
              </div>
            </div>

            {isDowngrade && (
              <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                Downgrade selected. Current plan features will stop working immediately after downgrade.
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {pricingPackages.map((pkg) => {
                const isSelected = selectedPackageId === pkg.id;
                const isCurrent = selectedBusiness?.pricingPackageId === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={`rounded-xl border-2 p-4 text-left transition ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50"
                        : "border-gray-200 hover:border-emerald-300"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <p className="font-semibold text-gray-900">{pkg.name}</p>
                      {isCurrent && (
                        <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-emerald-700">
                      GBP {pkg.price.toFixed(2)}/
                      {getBillingDurationLabel(pkg.billingPeriod, pkg.durationDays)}
                    </p>
                    <p className="mt-2 line-clamp-3 text-xs text-gray-600">
                      {pkg.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {selectedPackage && (
              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                <p className="mb-2 font-semibold text-gray-900">
                  Selected Plan Features ({selectedPackage.name})
                </p>
                {selectedPackageFeatureLabels.length === 0 ? (
                  <p>No explicit features configured for this package.</p>
                ) : (
                  <ul className="list-disc space-y-1 pl-5">
                    {selectedPackageFeatureLabels.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="mt-5">
              <button
                type="button"
                onClick={() => void handleChangePlan()}
                disabled={
                  changingPlan ||
                  verifyingUpgrade ||
                  !selectedBusinessId ||
                  !selectedPackageId ||
                  selectedBusiness?.pricingPackageId === selectedPackageId ||
                  downgradeToFreeBlocked
                }
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {changingPlan
                  ? isDowngrade
                    ? "Applying downgrade..."
                    : "Redirecting to checkout..."
                  : selectedBusiness?.pricingPackageId === selectedPackageId
                    ? "Current Plan Selected"
                    : isDowngrade
                      ? "Downgrade Plan"
                      : "Upgrade Plan"}
              </button>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl bg-white shadow-md">
            <div className="grid grid-cols-12 gap-4 border-b border-gray-100 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <div className="col-span-2">Started</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-3">Details</div>
              <div className="col-span-3 text-right">Action</div>
            </div>

            {loadingData ? (
              <div className="p-10 text-center text-gray-600">
                Loading billing data...
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
                          Expiring on{" "}
                          {new Date(item.currentPeriodEnd * 1000).toLocaleDateString()}
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
                      <p className="truncate">
                        Plan:{" "}
                        {(item.selectedPackage &&
                          packageNameById.get(item.selectedPackage)) ||
                          item.selectedPackage ||
                          "N/A"}
                      </p>
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
          </section>
        </div>
      </main>
    </div>
  );
}

