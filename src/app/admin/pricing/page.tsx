"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { pricingPackages as initialPackages } from "@/data/mockData";
import type { PricingPackage } from "@/data/mockData";

export default function PricingPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<PricingPackage[]>(initialPackages);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<PricingPackage>>({
    name: "",
    price: 0,
    billingPeriod: "monthly",
    description: "",
    features: [],
    featured: false,
    active: true,
  });

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
    }
  }, []);

  const handleEdit = (pkg: PricingPackage) => {
    setEditingId(pkg.id);
    setFormData(pkg);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this package?")) {
      setPackages((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...(formData.features || [])];
    newFeatures[index] = value;
    setFormData((prev) => ({
      ...prev,
      features: newFeatures,
    }));
  };

  const handleAddFeature = () => {
    setFormData((prev) => ({
      ...prev,
      features: [...(prev.features || []), ""],
    }));
  };

  const handleRemoveFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      setPackages((prev) =>
        prev.map((p) =>
          p.id === editingId
            ? {
                ...p,
                ...formData,
                price: parseFloat(formData.price as any),
              }
            : p,
        ),
      );
    } else {
      const newPackage: PricingPackage = {
        id: Date.now().toString(),
        name: formData.name || "",
        price: parseFloat(formData.price as any),
        billingPeriod: (formData.billingPeriod || "monthly") as any,
        description: formData.description || "",
        features: formData.features || [],
        featured: formData.featured || false,
        active: formData.active !== false,
      };
      setPackages((prev) => [...prev, newPackage]);
    }

    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({
      name: "",
      price: 0,
      billingPeriod: "monthly",
      description: "",
      features: [],
      featured: false,
      active: true,
    });
  };

  if (!isAuthenticated || user.role !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-stone-50">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">
                Pricing Packages
              </h1>
              <p className="text-gray-600">
                Manage subscription plans available to businesses
              </p>
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

          {/* Form Section */}
          {showForm && (
            <div className="bg-white rounded-2xl p-8 shadow-md mb-8">
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">
                {editingId ? "Edit Package" : "Create New Package"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Package Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ""}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Price (£)
                    </label>
                    <input
                      type="number"
                      name="price"
                      step="0.01"
                      value={formData.price || ""}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Billing Period
                    </label>
                    <select
                      name="billingPeriod"
                      value={formData.billingPeriod || "monthly"}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  <div className="flex items-end gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="featured"
                        checked={formData.featured || false}
                        onChange={handleChange}
                        className="w-4 h-4 mr-2"
                      />
                      <span className="text-sm font-semibold text-gray-700">
                        Mark as Featured
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="active"
                        checked={formData.active !== false}
                        onChange={handleChange}
                        className="w-4 h-4 mr-2"
                      />
                      <span className="text-sm font-semibold text-gray-700">
                        Active
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description || ""}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Features
                  </label>
                  <div className="space-y-2 mb-3">
                    {(formData.features || []).map((feature, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) =>
                            handleFeatureChange(idx, e.target.value)
                          }
                          className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                          placeholder="Enter feature"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition-colors"
                  >
                    + Add Feature
                  </button>
                </div>

                <div className="flex gap-4">
                  <button type="submit" className="flex-1 btn-primary">
                    {editingId ? "Update Package" : "Create Package"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-6 py-3 border-2 border-emerald-600 text-emerald-600 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`rounded-2xl p-6 shadow-md border-2 ${
                  pkg.featured
                    ? "border-emerald-600 bg-emerald-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                {pkg.featured && (
                  <div className="inline-block bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-semibold mb-3">
                    Featured
                  </div>
                )}

                <h3 className="font-display text-xl font-bold text-gray-900 mb-2">
                  {pkg.name}
                </h3>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-emerald-600">
                    £{pkg.price}
                  </span>
                  <span className="text-gray-600 text-sm">
                    /{pkg.billingPeriod}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>

                <div className="mb-6">
                  <p className="text-xs font-semibold text-gray-700 mb-2">
                    Features:
                  </p>
                  <ul className="space-y-1">
                    {pkg.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-gray-600 flex items-start"
                      >
                        <span className="text-emerald-600 mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(pkg)}
                    className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(pkg.id)}
                    className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>

                <div
                  className={`mt-4 text-xs font-semibold px-3 py-2 rounded-lg text-center ${
                    pkg.active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {pkg.active ? "✓ Active" : "Inactive"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
