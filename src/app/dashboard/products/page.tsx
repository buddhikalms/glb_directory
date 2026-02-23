"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useAuth } from "@/contexts/AuthContext";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  inStock: boolean;
};

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedBusinessId = useMemo(
    () => searchParams.get("businessId") ?? "",
    [searchParams],
  );
  const { user, isAuthenticated, loading } = useAuth();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState(preselectedBusinessId);
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
    inStock: true,
  });
  const [editData, setEditData] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
    inStock: true,
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

  const loadProducts = async (businessId: string) => {
    const response = await fetch(`/api/dashboard/owned-businesses/${businessId}/products`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.error || "Failed to load products.");
      return;
    }
    setProducts(Array.isArray(payload.products) ? payload.products : []);
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
    loadProducts(selectedBusinessId);
  }, [selectedBusinessId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
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
        `/api/dashboard/owned-businesses/${selectedBusinessId}/products`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            image: formData.image,
            inStock: formData.inStock,
          }),
        },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || "Failed to add product.");
        return;
      }
      setProducts((prev) => [payload.product, ...prev]);
      setFormData({
        name: "",
        description: "",
        price: "",
        image: "",
        inStock: true,
      });
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const uploadProductImage = async (file: File) => {
    const data = new FormData();
    data.append("file", file);
    data.append("kind", "gallery");
    const response = await fetch("/api/uploads/business-image", {
      method: "POST",
      body: data,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.url) {
      throw new Error(payload.error || "Failed to upload image.");
    }
    return payload.url as string;
  };

  const handleProductImageUpload = async (file: File, target: "create" | "edit") => {
    try {
      setError("");
      setUploadingImage(true);
      const url = await uploadProductImage(file);
      if (target === "edit") {
        setEditData((prev) => ({ ...prev, image: url }));
      } else {
        setFormData((prev) => ({ ...prev, image: url }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditData({
      name: product.name,
      description: product.description,
      price: String(product.price),
      image: product.image || "",
      inStock: product.inStock,
    });
  };

  const handleSaveEdit = async () => {
    if (!selectedBusinessId || !editingId) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(
        `/api/dashboard/owned-businesses/${selectedBusinessId}/products/${editingId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editData.name,
            description: editData.description,
            price: parseFloat(editData.price),
            image: editData.image,
            inStock: editData.inStock,
          }),
        },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || "Failed to update product.");
        return;
      }
      setProducts((prev) =>
        prev.map((item) => (item.id === editingId ? payload.product : item)),
      );
      setEditingId(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!selectedBusinessId) return;
    const response = await fetch(
      `/api/dashboard/owned-businesses/${selectedBusinessId}/products/${productId}`,
      { method: "DELETE" },
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.error || "Failed to delete product.");
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== productId));
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
                Products Manager
              </h1>
              <p className="text-gray-600">Add, edit, and assign products to a listing.</p>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="btn-primary">
              {showForm ? "Cancel" : "+ Add Product"}
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
                Add New Product
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Product Name" className="w-full rounded-lg border-2 border-gray-200 px-4 py-2" required />
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" rows={3} className="w-full resize-none rounded-lg border-2 border-gray-200 px-4 py-2" required />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="Price" step="0.01" className="w-full rounded-lg border-2 border-gray-200 px-4 py-2" required />
                  <input type="text" name="image" value={formData.image} onChange={handleChange} placeholder="Image URL" className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 md:col-span-2" />
                </div>
                <div className="rounded-lg border-2 border-gray-200 p-4">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Or upload product image</label>
                  <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleProductImageUpload(file, "create"); }} className="w-full" />
                  {uploadingImage && <p className="mt-2 text-sm text-gray-600">Uploading image...</p>}
                  {formData.image && <img src={formData.image} alt="Product preview" className="mt-3 h-24 w-24 rounded-lg object-cover" />}
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" name="inStock" checked={formData.inStock} onChange={handleChange} />
                  In stock
                </label>
                <button type="submit" disabled={submitting || uploadingImage} className="w-full btn-primary disabled:opacity-50">
                  {submitting ? "Adding..." : uploadingImage ? "Uploading..." : "Add Product"}
                </button>
              </form>
            </div>
          )}

          {products.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => {
                const isEditing = editingId === product.id;
                return (
                  <div key={product.id} className="rounded-2xl bg-white p-6 shadow-md">
                    {isEditing ? (
                      <div className="space-y-3">
                        <input type="text" name="name" value={editData.name} onChange={handleEditChange} className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm" />
                        <textarea name="description" value={editData.description} onChange={handleEditChange} rows={3} className="w-full resize-none rounded-lg border-2 border-gray-200 px-3 py-2 text-sm" />
                        <input type="number" step="0.01" name="price" value={editData.price} onChange={handleEditChange} className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm" />
                        <input type="text" name="image" value={editData.image} onChange={handleEditChange} placeholder="Image URL" className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm" />
                        <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleProductImageUpload(file, "edit"); }} className="w-full text-sm" />
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input type="checkbox" name="inStock" checked={editData.inStock} onChange={handleEditChange} />
                          In stock
                        </label>
                        <div className="flex gap-2">
                          <button type="button" onClick={handleSaveEdit} disabled={submitting} className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
                            Save
                          </button>
                          <button type="button" onClick={() => setEditingId(null)} className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="mb-3 h-36 w-full rounded-lg object-cover" />
                        ) : null}
                        <h3 className="mb-2 font-display text-lg font-bold text-gray-900">{product.name}</h3>
                        <p className="mb-3 text-sm text-gray-600">{product.description}</p>
                        <div className="mb-4 flex items-center justify-between">
                          <div className="text-lg font-bold text-emerald-600">
                            ${Number(product.price).toFixed(2)}
                          </div>
                          <span className={`rounded px-2 py-1 text-xs font-semibold ${product.inStock ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}`}>
                            {product.inStock ? "In Stock" : "Out of Stock"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button onClick={() => startEdit(product)} className="rounded-lg border-2 border-emerald-200 px-4 py-2 text-emerald-700 hover:bg-emerald-50">
                            Edit
                          </button>
                          <button onClick={() => handleDelete(product.id)} className="rounded-lg border-2 border-red-200 px-4 py-2 text-red-600 hover:bg-red-50">
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-12 text-center">
              <p className="text-lg text-gray-600">No products for this listing yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
