"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  createBusinessAction,
  deleteBusinessAction,
  updateBusinessAction,
  updateBusinessStatusAction,
} from "./actions";
import {
  emptyForm,
  slugify,
  type BusinessFormData,
  type BusinessRow,
  type BusinessStatus,
  type CategoryOption,
  type UserOption,
} from "./types";

interface BusinessesClientProps {
  initialBusinesses: BusinessRow[];
  categories: CategoryOption[];
  owners: UserOption[];
}

export default function BusinessesClient({
  initialBusinesses,
  categories,
  owners,
}: BusinessesClientProps) {
  const router = useRouter();
  const [allBusinesses, setAllBusinesses] =
    useState<BusinessRow[]>(initialBusinesses);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BusinessFormData>(emptyForm);
  const [uploading, setUploading] = useState({
    logo: false,
    coverImage: false,
  });
  const [filter, setFilter] = useState<
    "all" | "approved" | "pending" | "rejected"
  >("all");

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
  }, [isAuthenticated, router, user.role]);

  const filteredBusinesses =
    filter === "all"
      ? allBusinesses
      : allBusinesses.filter((item) => item.status === filter);
  const isUploading = uploading.logo || uploading.coverImage;

  const canSubmit = useMemo(() => {
    return Boolean(
      formData.name &&
        formData.slug &&
        formData.tagline &&
        formData.description &&
        formData.categoryId &&
        formData.ownerId,
    );
  }, [formData]);

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setUploading({ logo: false, coverImage: false });
    setShowForm(true);
  };

  const openEdit = (item: BusinessRow) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      slug: item.slug,
      tagline: item.tagline || "",
      description: item.description || "",
      categoryId: item.categoryId,
      ownerId: item.ownerId,
      logo: item.logo || "",
      coverImage: item.coverImage || "",
      city: item.location?.city || "",
      address: item.location?.address || "",
      postcode: item.location?.postcode || "",
      email: item.contact?.email || "",
      phone: item.contact?.phone || "",
      website: item.contact?.website || "",
      status: item.status,
      featured: Boolean(item.featured),
    });
    setUploading({ logo: false, coverImage: false });
    setShowForm(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const next =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => {
      const updated = { ...prev, [name]: next };
      if (name === "name" && !editingId) {
        updated.slug = slugify(value);
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isUploading) return;

    try {
      setSaving(true);
      setError(null);

      const payload: BusinessFormData = { ...formData };
      const saved = editingId
        ? await updateBusinessAction(editingId, payload)
        : await createBusinessAction(payload);

      setAllBusinesses((prev) => {
        if (editingId) {
          return prev.map((item) => (item.id === editingId ? saved : item));
        }
        return [saved, ...prev];
      });

      setShowForm(false);
      setEditingId(null);
      setFormData(emptyForm);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unexpected error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (
    field: "logo" | "coverImage",
    file: File,
  ) => {
    try {
      setError(null);
      setUploading((prev) => ({ ...prev, [field]: true }));

      const data = new FormData();
      data.append("file", file);
      data.append("kind", field === "logo" ? "logo" : "cover");

      const response = await fetch("/api/uploads/business-image", {
        method: "POST",
        body: data,
      });

      const payload = await response.json();
      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error || "Upload failed.");
      }

      setFormData((prev) => ({ ...prev, [field]: payload.url }));
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed.",
      );
    } finally {
      setUploading((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this business?")) return;

    try {
      setError(null);
      await deleteBusinessAction(id);
      setAllBusinesses((prev) => prev.filter((item) => item.id !== id));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Unexpected error",
      );
    }
  };

  const handleStatusChange = async (id: string, status: BusinessStatus) => {
    try {
      setError(null);
      const updated = await updateBusinessStatusAction(id, status);

      setAllBusinesses((prev) =>
        prev.map((item) => (item.id === id ? updated : item)),
      );
    } catch (statusError) {
      setError(
        statusError instanceof Error ? statusError.message : "Unexpected error",
      );
    }
  };

  if (!isAuthenticated || user.role !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-stone-50">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">
                Manage Businesses
              </h1>
              <p className="text-gray-600">
                Load businesses from database and manage CRUD operations.
              </p>
            </div>
            <button onClick={openCreate} className="btn-primary">
              + Add Business
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {showForm && (
            <div className="mb-8 rounded-2xl bg-white p-8 shadow-md">
              <h2 className="mb-6 font-display text-2xl font-bold text-gray-900">
                {editingId ? "Edit Business" : "Add New Business"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Business name"
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                  <input
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="Slug"
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <select
                    name="ownerId"
                    value={formData.ownerId}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    required
                  >
                    <option value="">Select owner</option>
                    {owners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.name}
                      </option>
                    ))}
                  </select>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleChange}
                  placeholder="Tagline"
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  required
                />

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Description"
                  className="w-full resize-none rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  required
                />

                <div className="grid grid-cols-3 gap-4">
                  <input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                  <input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Address"
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                  <input
                    name="postcode"
                    value={formData.postcode}
                    onChange={handleChange}
                    placeholder="Postcode"
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Contact email"
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Contact phone"
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                  <input
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="Website URL"
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-lg border-2 border-gray-200 p-4">
                    <p className="mb-2 text-sm font-semibold text-gray-700">
                      Logo Image
                    </p>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload("logo", file);
                      }}
                      className="w-full text-sm"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      JPG, PNG, WEBP, or GIF up to 5MB.
                    </p>
                    {uploading.logo && (
                      <p className="mt-2 text-xs text-emerald-700">Uploading...</p>
                    )}
                    {formData.logo && (
                      <div className="mt-3">
                        <img
                          src={formData.logo}
                          alt="Business logo preview"
                          className="h-20 w-20 rounded-md border object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, logo: "" }))
                          }
                          className="mt-2 text-xs font-semibold text-red-600 hover:text-red-700"
                        >
                          Remove logo
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border-2 border-gray-200 p-4">
                    <p className="mb-2 text-sm font-semibold text-gray-700">
                      Cover Image
                    </p>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload("coverImage", file);
                      }}
                      className="w-full text-sm"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      JPG, PNG, WEBP, or GIF up to 5MB.
                    </p>
                    {uploading.coverImage && (
                      <p className="mt-2 text-xs text-emerald-700">Uploading...</p>
                    )}
                    {formData.coverImage && (
                      <div className="mt-3">
                        <img
                          src={formData.coverImage}
                          alt="Business cover preview"
                          className="h-20 w-full rounded-md border object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, coverImage: "" }))
                          }
                          className="mt-2 text-xs font-semibold text-red-600 hover:text-red-700"
                        >
                          Remove cover
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <label className="flex items-center gap-2 rounded-lg border-2 border-gray-200 px-4 py-2">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={formData.featured}
                      onChange={handleChange}
                    />
                    <span className="text-sm font-medium text-gray-700">Featured</span>
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={!canSubmit || saving || isUploading}
                    className="btn-primary disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : isUploading
                        ? "Uploading..."
                      : editingId
                        ? "Save Changes"
                        : "Create Business"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setFormData(emptyForm);
                      setUploading({ logo: false, coverImage: false });
                    }}
                    className="rounded-lg border-2 border-gray-200 px-4 py-2 text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="mb-8 flex gap-2">
            {(["all", "approved", "pending", "rejected"] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`rounded-lg px-4 py-2 font-semibold transition-all ${
                    filter === status
                      ? "bg-emerald-600 text-white"
                      : "border-2 border-gray-200 bg-white text-gray-700 hover:border-emerald-600"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)} (
                  {status === "all"
                    ? allBusinesses.length
                    : allBusinesses.filter((b) => b.status === status).length}
                  )
                </button>
              ),
            )}
          </div>

          {filteredBusinesses.length > 0 ? (
            <div className="overflow-hidden rounded-2xl bg-white shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Business
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Owner
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Category
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBusinesses.map((business, idx) => (
                      <tr
                        key={business.id}
                        className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">{business.name}</p>
                          <p className="text-xs text-gray-600">
                            {business.location?.city || "N/A"}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {business.owner?.name || business.ownerId}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {business.category?.name || business.categoryId}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              business.status === "approved"
                                ? "bg-emerald-100 text-emerald-700"
                                : business.status === "rejected"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {business.status.charAt(0).toUpperCase() +
                              business.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEdit(business)}
                              className="rounded-lg bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 hover:bg-blue-200"
                            >
                              Edit
                            </button>
                            {business.status !== "approved" && (
                              <button
                                onClick={() =>
                                  handleStatusChange(business.id, "approved")
                                }
                                className="rounded-lg bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 hover:bg-emerald-200"
                              >
                                Approve
                              </button>
                            )}
                            {business.status !== "rejected" && (
                              <button
                                onClick={() =>
                                  handleStatusChange(business.id, "rejected")
                                }
                                className="rounded-lg bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700 hover:bg-amber-200"
                              >
                                Reject
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(business.id)}
                              className="rounded-lg bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-12 text-center">
              <p className="text-lg text-gray-600">
                No businesses found with this filter.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
