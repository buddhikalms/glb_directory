"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import type { PricingPackage } from "@/data/mockData";
import {
  getPackageFeatureLabel,
  normalizePackageFeatures,
  PACKAGE_FEATURE_OPTIONS,
  type PackageFeatureKey,
} from "@/lib/package-features";
import {
  getBillingDurationDays,
  getBillingDurationLabel,
  getBillingPeriodFromDurationDays,
} from "@/lib/pricing-duration";

const emptyForm: Partial<PricingPackage> = {
  name: "",
  price: 0,
  billingPeriod: "monthly",
  durationDays: 30,
  description: "",
  features: [],
  galleryLimit: 0,
  featured: false,
  active: true,
};

export default function PricingPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<PricingPackage>>(emptyForm);
  const selectedFormFeatures = useMemo(
    () => normalizePackageFeatures(formData.features),
    [formData.features],
  );

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

    const loadPackages = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/pricing", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load pricing packages");
        const data = (await res.json()) as Array<
          Omit<PricingPackage, "features"> & { features: unknown }
        >;

        const normalized: PricingPackage[] = data.map((item) => ({
          ...item,
          features: normalizePackageFeatures(item.features),
          galleryLimit: Number(item.galleryLimit || 0),
          durationDays: getBillingDurationDays(
            item.billingPeriod,
            Number(item.durationDays || 0),
          ),
        }));

        setPackages(normalized);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unexpected error");
      } finally {
        setLoading(false);
      }
    };

    loadPackages();
  }, [isAuthenticated, router, user.role]);

  const canSubmit = useMemo(() => {
    return Boolean(
        formData.name &&
        formData.description &&
        selectedFormFeatures.length > 0 &&
        Number(formData.price) >= 0 &&
        Number(formData.durationDays) >= 1 &&
        Number(formData.galleryLimit) >= 0,
    );
  }, [formData, selectedFormFeatures.length]);

  const handleEdit = (pkg: PricingPackage) => {
    setEditingId(pkg.id);
    setFormData(pkg);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this package?")) return;

    try {
      setError(null);
      const res = await fetch(`/api/pricing/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete package");
      setPackages((prev) => prev.filter((p) => p.id !== id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unexpected error");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : name === "price" || name === "galleryLimit" || name === "durationDays"
            ? Number(value)
            : value,
    }));
  };

  const toggleFeature = (featureKey: PackageFeatureKey, checked: boolean) => {
    setFormData((prev) => {
      const current = normalizePackageFeatures(prev.features);
      if (checked) {
        return {
          ...prev,
          features: Array.from(new Set([...current, featureKey])),
        };
      }
      return {
        ...prev,
        features: current.filter((item) => item !== featureKey),
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || saving) return;

    try {
      setSaving(true);
      setError(null);

      const payload = {
        name: formData.name || "",
        price: Number(formData.price || 0),
        billingPeriod: getBillingPeriodFromDurationDays(
          Number(formData.durationDays || 30),
        ),
        durationDays: Number(formData.durationDays || 30),
        description: formData.description || "",
        features: selectedFormFeatures,
        galleryLimit: Number(formData.galleryLimit || 0),
        featured: Boolean(formData.featured),
        active: formData.active !== false,
      };

      const res = await fetch(editingId ? `/api/pricing/${editingId}` : "/api/pricing", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to save package");
      }

      const saved = (await res.json()) as PricingPackage;
      setPackages((prev) => {
        if (editingId) {
          return prev.map((p) => (p.id === editingId ? saved : p));
        }
        return [saved, ...prev];
      });

      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData(emptyForm);
  };

  if (!isAuthenticated || user.role !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-stone-50">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="mb-2 font-display text-4xl font-bold text-gray-900">Pricing Packages</h1>
              <p className="text-gray-600">Manage plans and gallery image limits for listings.</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="btn-primary"
            >
              + Add Package
            </button>
          </div>

          {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {showForm && (
            <div className="mb-8 rounded-2xl bg-white p-8 shadow-md">
              <h2 className="mb-6 font-display text-2xl font-bold text-gray-900">{editingId ? "Edit Package" : "Create New Package"}</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Package Name</label>
                    <input type="text" name="name" value={formData.name || ""} onChange={handleChange} className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none" required />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Price</label>
                    <input type="number" name="price" step="0.01" min="0" value={formData.price ?? 0} onChange={handleChange} className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none" required />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Duration (days)</label>
                    <input type="number" name="durationDays" min="1" max="365" value={formData.durationDays ?? 30} onChange={handleChange} className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none" required />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Gallery Image Limit</label>
                    <input type="number" name="galleryLimit" min="0" value={formData.galleryLimit ?? 0} onChange={handleChange} className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none" required />
                  </div>

                  <div className="flex items-end gap-4 md:col-span-2">
                    <label className="flex items-center">
                      <input type="checkbox" name="featured" checked={formData.featured || false} onChange={handleChange} className="mr-2 h-4 w-4" />
                      <span className="text-sm font-semibold text-gray-700">Featured</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" name="active" checked={formData.active !== false} onChange={handleChange} className="mr-2 h-4 w-4" />
                      <span className="text-sm font-semibold text-gray-700">Active</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Description</label>
                  <textarea name="description" value={formData.description || ""} onChange={handleChange} rows={3} className="w-full resize-none rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none" />
                </div>

                <div>
                  <label className="mb-3 block text-sm font-semibold text-gray-700">Features</label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {PACKAGE_FEATURE_OPTIONS.map((feature) => {
                      const checked = selectedFormFeatures.includes(feature.key);
                      return (
                        <label
                          key={feature.key}
                          className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) =>
                              toggleFeature(feature.key, event.target.checked)
                            }
                          />
                          <span className="text-sm text-gray-700">{feature.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button type="submit" disabled={!canSubmit || saving} className="btn-primary flex-1 disabled:opacity-50">{saving ? "Saving..." : editingId ? "Update Package" : "Create Package"}</button>
                  <button type="button" onClick={resetForm} className="flex-1 rounded-lg border-2 border-emerald-600 px-6 py-3 font-semibold text-emerald-600 transition-colors hover:bg-emerald-50">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl bg-white p-8 text-center text-gray-600">Loading packages...</div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {packages.map((pkg) => (
                <div key={pkg.id} className={`rounded-2xl p-6 shadow-md border-2 ${pkg.featured ? "border-emerald-600 bg-emerald-50" : "border-gray-200 bg-white"}`}>
                  {pkg.featured && <div className="inline-block bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-semibold mb-3">Featured</div>}
                  <h3 className="mb-2 font-display text-xl font-bold text-gray-900">{pkg.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-emerald-600">${pkg.price}</span>
                    <span className="text-sm text-gray-600">/{getBillingDurationLabel(pkg.billingPeriod, pkg.durationDays)}</span>
                  </div>
                  <p className="mb-2 text-xs font-semibold text-gray-700">Gallery limit: {pkg.galleryLimit} images</p>
                  <p className="mb-4 text-sm text-gray-600">{pkg.description}</p>
                  <div className="mb-6">
                    <p className="mb-2 text-xs font-semibold text-gray-700">Features:</p>
                    <ul className="space-y-1">
                      {normalizePackageFeatures(pkg.features).map((feature, idx) => (
                        <li key={idx} className="flex items-start text-xs text-gray-600"><span className="mr-2 text-emerald-600">-</span>{getPackageFeatureLabel(feature)}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(pkg)} className="flex-1 rounded-lg bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-200 transition-colors">Edit</button>
                    <button onClick={() => handleDelete(pkg.id)} className="flex-1 rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-200 transition-colors">Delete</button>
                  </div>
                  <div className={`mt-4 rounded-lg px-3 py-2 text-center text-xs font-semibold ${pkg.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}`}>
                    {pkg.active ? "Active" : "Inactive"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
