"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

type LocationProvider = "google" | "geoapify" | "openstreetmap";
type DowngradeDecisionMode = "auto" | "admin_approval";
type PricingPackageOption = {
  id: string;
  name: string;
  active: boolean;
};

type DowngradeRequest = {
  id: string;
  ownerUserId: string;
  ownerEmail: string | null;
  ownerName: string | null;
  businessId: string;
  businessName: string;
  currentPackageId: string;
  currentPackageName: string;
  targetPackageId: string;
  targetPackageName: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
  decidedAt: string | null;
  decidedByUserId: string | null;
  decidedByName: string | null;
};

interface LocationSettings {
  provider: LocationProvider;
  googleMapsApiKey: string;
  geoapifyApiKey: string;
}

const STORAGE_KEY = "admin.locationProviderSettings";

const defaultSettings: LocationSettings = {
  provider: "geoapify",
  googleMapsApiKey: "",
  geoapifyApiKey: "",
};

export default function AdminSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<LocationSettings>(defaultSettings);
  const [saved, setSaved] = useState(false);

  const [downgradeMode, setDowngradeMode] =
    useState<DowngradeDecisionMode>("auto");
  const [expiredListingPackageId, setExpiredListingPackageId] = useState("");
  const [pricingPackageOptions, setPricingPackageOptions] = useState<
    PricingPackageOption[]
  >([]);
  const [downgradeSaved, setDowngradeSaved] = useState(false);
  const [downgradeSaving, setDowngradeSaving] = useState(false);
  const [downgradeLoading, setDowngradeLoading] = useState(true);
  const [downgradeError, setDowngradeError] = useState<string | null>(null);
  const [downgradeRequests, setDowngradeRequests] = useState<DowngradeRequest[]>(
    [],
  );
  const [decidingRequestId, setDecidingRequestId] = useState<string | null>(null);

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : {};
  const isAuthenticated =
    typeof window !== "undefined"
      ? localStorage.getItem("isAuthenticated") === "true"
      : false;

  const loadDowngradeSettings = async () => {
    try {
      setDowngradeLoading(true);
      setDowngradeError(null);

      const [policyRes, requestsRes] = await Promise.all([
        fetch("/api/admin/downgrade-policy", { cache: "no-store" }),
        fetch("/api/admin/downgrade-requests?status=pending", {
          cache: "no-store",
        }),
      ]);
      const packagesRes = await fetch("/api/pricing", { cache: "no-store" });

      const policyPayload = await policyRes.json().catch(() => ({}));
      if (!policyRes.ok) {
        throw new Error(policyPayload?.error || "Failed to load downgrade policy.");
      }

      const requestsPayload = await requestsRes.json().catch(() => ({}));
      if (!requestsRes.ok) {
        throw new Error(
          requestsPayload?.error || "Failed to load downgrade requests.",
        );
      }
      const packagesPayload = await packagesRes.json().catch(() => ([]));
      if (!packagesRes.ok) {
        throw new Error("Failed to load pricing packages.");
      }

      const normalizedPackages = (Array.isArray(packagesPayload) ? packagesPayload : [])
        .filter(
          (item): item is PricingPackageOption =>
            Boolean(item?.id && item?.name && item?.active),
        )
        .map((item) => ({
          id: item.id,
          name: item.name,
          active: Boolean(item.active),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setDowngradeMode(
        policyPayload?.mode === "admin_approval" ? "admin_approval" : "auto",
      );
      setExpiredListingPackageId(policyPayload?.expiredListingPackageId || "");
      setPricingPackageOptions(normalizedPackages);
      setDowngradeRequests(
        Array.isArray(requestsPayload?.requests) ? requestsPayload.requests : [],
      );
    } catch (error) {
      setDowngradeError(
        error instanceof Error ? error.message : "Unexpected error",
      );
    } finally {
      setDowngradeLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || user.role !== "admin") {
      router.push("/login");
      return;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<LocationSettings>;
        setSettings({
          provider:
            parsed.provider === "google" ||
            parsed.provider === "geoapify" ||
            parsed.provider === "openstreetmap"
              ? parsed.provider
              : "geoapify",
          googleMapsApiKey: parsed.googleMapsApiKey || "",
          geoapifyApiKey: parsed.geoapifyApiKey || "",
        });
      } catch {
        setSettings(defaultSettings);
      }
    }

    void loadDowngradeSettings();
  }, [isAuthenticated, router, user.role]);

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveDowngradeMode = async () => {
    try {
      setDowngradeSaving(true);
      setDowngradeSaved(false);
      setDowngradeError(null);

      const res = await fetch("/api/admin/downgrade-policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: downgradeMode,
          expiredListingPackageId: expiredListingPackageId || null,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to save downgrade policy.");
      }

      setDowngradeSaved(true);
      setTimeout(() => setDowngradeSaved(false), 2000);
      await loadDowngradeSettings();
    } catch (error) {
      setDowngradeError(
        error instanceof Error ? error.message : "Unexpected error",
      );
    } finally {
      setDowngradeSaving(false);
    }
  };

  const decideDowngradeRequest = async (
    requestId: string,
    decision: "approve" | "reject",
  ) => {
    const confirmMessage =
      decision === "approve"
        ? "Approve this downgrade request? This will apply the downgrade now."
        : "Reject this downgrade request?";
    if (!confirm(confirmMessage)) return;

    try {
      setDecidingRequestId(requestId);
      setDowngradeError(null);

      const res = await fetch(
        `/api/admin/downgrade-requests/${encodeURIComponent(requestId)}/decision`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision }),
        },
      );
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to process request.");
      }

      setDowngradeRequests((prev) =>
        prev.filter((item) => item.id !== requestId),
      );
    } catch (error) {
      setDowngradeError(
        error instanceof Error ? error.message : "Unexpected error",
      );
    } finally {
      setDecidingRequestId(null);
    }
  };

  if (!isAuthenticated || user.role !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-stone-50">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-5xl">
          <h1 className="mb-2 font-display text-4xl font-bold text-gray-900">
            Settings
          </h1>
          <p className="mb-8 text-gray-600">
            Configure admin settings including location provider and downgrade policy.
          </p>

          {saved && (
            <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              Location settings saved.
            </div>
          )}
          {downgradeSaved && (
            <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              Downgrade policy saved.
            </div>
          )}
          {downgradeError && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {downgradeError}
            </div>
          )}

          <form
            onSubmit={saveSettings}
            className="mb-8 space-y-6 rounded-2xl bg-white p-8 shadow-md"
          >
            <h2 className="font-display text-2xl font-bold text-gray-900">
              Location Provider
            </h2>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Location Provider
              </label>
              <select
                value={settings.provider}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    provider: e.target.value as LocationProvider,
                  }))
                }
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
              >
                <option value="geoapify">Geoapify</option>
                <option value="google">Google Maps</option>
                <option value="openstreetmap">OpenStreetMap (Nominatim)</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Google Maps API Key (optional)
              </label>
              <input
                type="text"
                value={settings.googleMapsApiKey}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    googleMapsApiKey: e.target.value.trim(),
                  }))
                }
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                placeholder="AIza..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Geoapify API Key (optional)
              </label>
              <input
                type="text"
                value={settings.geoapifyApiKey}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    geoapifyApiKey: e.target.value.trim(),
                  }))
                }
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                placeholder="Your Geoapify key"
              />
            </div>

            <p className="text-sm text-gray-500">
              Saved keys are browser-local for admin usage. Environment variables
              are still used as fallback.
            </p>

            <button type="submit" className="btn-primary">
              Save Location Settings
            </button>
          </form>

          <section className="rounded-2xl bg-white p-8 shadow-md">
            <h2 className="mb-2 font-display text-2xl font-bold text-gray-900">
              Downgrade Policy
            </h2>
            <p className="mb-6 text-sm text-gray-600">
              Choose whether downgrades are applied automatically or must be approved by admin.
            </p>

            {downgradeLoading ? (
              <p className="text-sm text-gray-600">Loading downgrade settings...</p>
            ) : (
              <>
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Decision Mode
                  </label>
                  <select
                    value={downgradeMode}
                    onChange={(e) =>
                      setDowngradeMode(e.target.value as DowngradeDecisionMode)
                    }
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="auto">Auto apply downgrade</option>
                    <option value="admin_approval">Require admin approval</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Expired Listing Package
                  </label>
                  <select
                    value={expiredListingPackageId}
                    onChange={(e) => setExpiredListingPackageId(e.target.value)}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">Not configured</option>
                    {pricingPackageOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    Paid listings past their plan duration are automatically assigned this package.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void saveDowngradeMode()}
                  disabled={downgradeSaving}
                  className="btn-primary disabled:opacity-60"
                >
                  {downgradeSaving ? "Saving..." : "Save Downgrade Policy"}
                </button>

                {downgradeMode === "admin_approval" && (
                  <div className="mt-8">
                    <h3 className="mb-3 text-lg font-semibold text-gray-900">
                      Pending Downgrade Requests
                    </h3>
                    {downgradeRequests.length === 0 ? (
                      <p className="text-sm text-gray-600">
                        No pending downgrade requests.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {downgradeRequests.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-lg border border-gray-200 p-4"
                          >
                            <p className="font-semibold text-gray-900">{item.businessName}</p>
                            <p className="text-sm text-gray-700">
                              {item.currentPackageName} {"->"} {item.targetPackageName}
                            </p>
                            <p className="text-xs text-gray-500">
                              Requested by {item.ownerEmail || item.ownerUserId} on{" "}
                              {new Date(item.createdAt).toLocaleString()}
                            </p>
                            <div className="mt-3 flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  void decideDowngradeRequest(item.id, "approve")
                                }
                                disabled={decidingRequestId === item.id}
                                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                              >
                                {decidingRequestId === item.id
                                  ? "Processing..."
                                  : "Approve"}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  void decideDowngradeRequest(item.id, "reject")
                                }
                                disabled={decidingRequestId === item.id}
                                className="rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

