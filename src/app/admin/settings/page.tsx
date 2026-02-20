"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

type LocationProvider = "google" | "geoapify" | "openstreetmap";

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

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

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
  }, [isAuthenticated, router, user.role]);

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!isAuthenticated || user.role !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-stone-50">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-3xl">
          <h1 className="mb-2 font-display text-4xl font-bold text-gray-900">
            Settings
          </h1>
          <p className="mb-8 text-gray-600">
            Configure location autocomplete provider for admin business forms.
          </p>

          {saved && (
            <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              Settings saved.
            </div>
          )}

          <form
            onSubmit={saveSettings}
            className="rounded-2xl bg-white p-8 shadow-md space-y-6"
          >
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
              Save Settings
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
