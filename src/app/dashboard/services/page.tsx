"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useAuth } from "@/contexts/AuthContext";

type Service = {
  id: string;
  name: string;
  description: string;
  pricing: string;
};

export default function ServicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedBusinessId = useMemo(
    () => searchParams.get("businessId") ?? "",
    [searchParams],
  );
  const { user, isAuthenticated, loading } = useAuth();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState(preselectedBusinessId);
  const [services, setServices] = useState<Service[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    pricing: "",
  });
  const [editData, setEditData] = useState({
    name: "",
    description: "",
    pricing: "",
  });

  const loadBusinesses = async () => {
    const response = await fetch("/api/dashboard/owned-businesses");
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.error || "Failed to load businesses.");
      return;
    }
    const list = Array.isArray(payload.businesses) ? payload.businesses : [];
    setBusinesses(list);
    if (!selectedBusinessId && list.length > 0) {
      const match =
        preselectedBusinessId &&
        list.some((item: { id: string }) => item.id === preselectedBusinessId);
      setSelectedBusinessId(match ? preselectedBusinessId : list[0].id);
    }
  };

  const loadServices = async (businessId: string) => {
    const response = await fetch(`/api/dashboard/owned-businesses/${businessId}/services`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.error || "Failed to load services.");
      return;
    }
    setServices(Array.isArray(payload.services) ? payload.services : []);
  };

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || user?.role !== "business_owner") {
      router.push("/login");
      return;
    }
    loadBusinesses();
  }, [isAuthenticated, loading, router, user?.role]);

  useEffect(() => {
    if (!selectedBusinessId) return;
    loadServices(selectedBusinessId);
  }, [selectedBusinessId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusinessId) {
      setError("Select a business first.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(
        `/api/dashboard/owned-businesses/${selectedBusinessId}/services`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || "Failed to add service.");
        return;
      }
      setServices((prev) => [payload.service, ...prev]);
      setFormData({ name: "", description: "", pricing: "" });
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (item: Service) => {
    setEditingId(item.id);
    setEditData({
      name: item.name,
      description: item.description,
      pricing: item.pricing,
    });
  };

  const handleSaveEdit = async () => {
    if (!selectedBusinessId || !editingId) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(
        `/api/dashboard/owned-businesses/${selectedBusinessId}/services/${editingId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editData),
        },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || "Failed to update service.");
        return;
      }
      setServices((prev) =>
        prev.map((item) => (item.id === editingId ? payload.service : item)),
      );
      setEditingId(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!selectedBusinessId) return;
    const response = await fetch(
      `/api/dashboard/owned-businesses/${selectedBusinessId}/services/${serviceId}`,
      { method: "DELETE" },
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.error || "Failed to delete service.");
      return;
    }
    setServices((prev) => prev.filter((item) => item.id !== serviceId));
  };

  if (loading) return null;

  return (
    <div className="flex min-h-screen bg-stone-50">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="mb-2 font-display text-4xl font-bold text-gray-900">
                Services Manager
              </h1>
              <p className="text-gray-600">Add, edit, and assign services to a listing.</p>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="btn-primary">
              {showForm ? "Cancel" : "+ Add Service"}
            </button>
          </div>

          <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Select Business Listing
            </label>
            <select
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none md:w-96"
            >
              <option value="">Select listing</option>
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {showForm && (
            <div className="mb-8 rounded-2xl bg-white p-8 shadow-md">
              <h2 className="mb-6 font-display text-2xl font-bold text-gray-900">
                Add Service
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Service Name" className="w-full rounded-lg border-2 border-gray-200 px-4 py-2" required />
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" rows={3} className="w-full resize-none rounded-lg border-2 border-gray-200 px-4 py-2" required />
                <input type="text" name="pricing" value={formData.pricing} onChange={handleChange} placeholder="Pricing" className="w-full rounded-lg border-2 border-gray-200 px-4 py-2" required />
                <button type="submit" disabled={submitting} className="w-full btn-primary disabled:opacity-50">
                  {submitting ? "Adding..." : "Add Service"}
                </button>
              </form>
            </div>
          )}

          {services.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {services.map((item) => {
                const isEditing = editingId === item.id;
                return (
                  <div key={item.id} className="rounded-2xl bg-white p-6 shadow-md">
                    {isEditing ? (
                      <div className="space-y-3">
                        <input type="text" name="name" value={editData.name} onChange={handleEditChange} className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm" />
                        <textarea name="description" value={editData.description} onChange={handleEditChange} rows={3} className="w-full resize-none rounded-lg border-2 border-gray-200 px-3 py-2 text-sm" />
                        <input type="text" name="pricing" value={editData.pricing} onChange={handleEditChange} className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm" />
                        <div className="flex gap-2">
                          <button type="button" onClick={handleSaveEdit} className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Save</button>
                          <button type="button" onClick={() => setEditingId(null)} className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="mb-2 font-display text-lg font-bold text-gray-900">{item.name}</h3>
                        <p className="mb-4 text-sm text-gray-600">{item.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-emerald-600">{item.pricing}</div>
                          <div className="flex gap-2">
                            <button onClick={() => startEdit(item)} className="rounded-lg border-2 border-emerald-200 px-4 py-2 text-emerald-700 hover:bg-emerald-50">Edit</button>
                            <button onClick={() => handleDelete(item.id)} className="rounded-lg border-2 border-red-200 px-4 py-2 text-red-600 hover:bg-red-50">Delete</button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-12 text-center">
              <p className="text-lg text-gray-600">No services for this listing yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
