"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { badges, categories, getActivePricingPackages } from "@/data/mockData";

type BusinessItem = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  seoKeywords?: string | null;
  categoryId: string;
  pricingPackageId?: string | null;
  logo: string;
  coverImage: string;
  gallery?: string[] | null;
  status: string;
  location?: Record<string, unknown> | null;
  contact?: Record<string, unknown> | null;
  social?: Record<string, unknown> | null;
  sustainability?: unknown;
  badges?: Array<{ badgeId: string }>;
  createdAt?: string;
  updatedAt?: string;
};

type SocialForm = {
  facebook: string;
  instagram: string;
  linkedin: string;
  x: string;
  youtube: string;
};

function toString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function parseSustainabilityText(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toSocialForm(value: unknown): SocialForm {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    facebook: toString(source.facebook),
    instagram: toString(source.instagram),
    linkedin: toString(source.linkedin),
    x: toString(source.x) || toString(source.twitter),
    youtube: toString(source.youtube),
  };
}

export default function BusinessPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const packages = useMemo(() => getActivePricingPackages(), []);
  const [items, setItems] = useState<BusinessItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<BusinessItem | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState({
    logo: false,
    cover: false,
    gallery: false,
  });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    tagline: "",
    description: "",
    seoKeywords: "",
    categoryId: "",
    pricingPackageId: "",
    city: "",
    address: "",
    postcode: "",
    country: "",
    email: "",
    phone: "",
    website: "",
    logo: "",
    coverImage: "",
    gallery: [] as string[],
    badgeIds: [] as string[],
    socialFacebook: "",
    socialInstagram: "",
    socialLinkedin: "",
    socialX: "",
    socialYoutube: "",
    sustainabilityText: "",
  });

  const loadBusinesses = async () => {
    setPageLoading(true);
    setError("");
    try {
      const response = await fetch("/api/dashboard/owned-businesses");
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || "Failed to load businesses.");
        return;
      }
      const list = Array.isArray(payload.businesses) ? payload.businesses : [];
      setItems(list);
      if (!selectedId && list.length > 0) {
        setSelectedId(list[0].id);
      }
      if (list.length === 0) {
        setSelectedId(null);
        setSelected(null);
      }
    } finally {
      setPageLoading(false);
    }
  };

  const loadBusinessDetails = async (businessId: string) => {
    const response = await fetch(
      `/api/dashboard/owned-businesses/${encodeURIComponent(businessId)}`,
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.business) {
      setError(payload.error || "Failed to load business details.");
      return;
    }

    const item = payload.business as BusinessItem;
    const social = toSocialForm(item.social);
    setSelected(item);
    setFormData({
      name: item.name || "",
      slug: item.slug || "",
      tagline: item.tagline || "",
      description: item.description || "",
      seoKeywords: item.seoKeywords || "",
      categoryId: item.categoryId || "",
      pricingPackageId: item.pricingPackageId || "",
      city: toString(item.location?.city),
      address: toString(item.location?.address),
      postcode: toString(item.location?.postcode),
      country: toString(item.location?.country),
      email: toString(item.contact?.email),
      phone: toString(item.contact?.phone),
      website: toString(item.contact?.website),
      logo: item.logo || "",
      coverImage: item.coverImage || "",
      gallery: Array.isArray(item.gallery) ? item.gallery : [],
      badgeIds: Array.isArray(item.badges)
        ? item.badges.map((entry) => entry.badgeId)
        : [],
      socialFacebook: social.facebook,
      socialInstagram: social.instagram,
      socialLinkedin: social.linkedin,
      socialX: social.x,
      socialYoutube: social.youtube,
      sustainabilityText: toStringArray(item.sustainability).join("\n"),
    });
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
    if (!selectedId) return;
    loadBusinessDetails(selectedId);
  }, [selectedId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const uploadBusinessImage = async (
    kind: "logo" | "cover" | "gallery",
    file: File,
  ) => {
    const data = new FormData();
    data.append("file", file);
    data.append("kind", kind);
    const response = await fetch("/api/uploads/business-image", {
      method: "POST",
      body: data,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.url) {
      throw new Error(payload.error || "Upload failed.");
    }
    return payload.url as string;
  };

  const handleUpload = async (field: "logo" | "coverImage", file: File) => {
    try {
      setError("");
      setUploading((prev) => ({
        ...prev,
        [field === "logo" ? "logo" : "cover"]: true,
      }));
      const url = await uploadBusinessImage(field === "logo" ? "logo" : "cover", file);
      setFormData((prev) => ({ ...prev, [field]: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading((prev) => ({
        ...prev,
        [field === "logo" ? "logo" : "cover"]: false,
      }));
    }
  };

  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      setUploading((prev) => ({ ...prev, gallery: true }));
      const urls = await Promise.all(
        Array.from(files).map((file) => uploadBusinessImage("gallery", file)),
      );
      setFormData((prev) => ({ ...prev, gallery: [...prev.gallery, ...urls] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gallery upload failed.");
    } finally {
      setUploading((prev) => ({ ...prev, gallery: false }));
    }
  };

  const handleGalleryRemove = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, idx) => idx !== index),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const response = await fetch(`/api/dashboard/owned-businesses/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          tagline: formData.tagline,
          description: formData.description,
          seoKeywords: formData.seoKeywords,
          categoryId: formData.categoryId,
          pricingPackageId: formData.pricingPackageId || null,
          logo: formData.logo,
          coverImage: formData.coverImage,
          gallery: formData.gallery,
          location: {
            ...(selected?.location || {}),
            city: formData.city,
            address: formData.address,
            postcode: formData.postcode,
            country: formData.country,
          },
          contact: {
            ...(selected?.contact || {}),
            email: formData.email,
            phone: formData.phone,
            website: formData.website,
          },
          social: {
            facebook: formData.socialFacebook,
            instagram: formData.socialInstagram,
            linkedin: formData.socialLinkedin,
            x: formData.socialX,
            youtube: formData.socialYoutube,
          },
          sustainability: parseSustainabilityText(formData.sustainabilityText),
          badgeIds: formData.badgeIds,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || "Failed to save changes.");
        return;
      }

      setSaved(true);
      await loadBusinesses();
      await loadBusinessDetails(selectedId);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (businessId: string) => {
    if (!confirm("Delete this listing? This action cannot be undone.")) return;
    setDeletingId(businessId);
    setError("");
    try {
      const response = await fetch(`/api/dashboard/owned-businesses/${businessId}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || "Failed to delete listing.");
        return;
      }
      const nextItems = items.filter((item) => item.id !== businessId);
      setItems(nextItems);
      if (selectedId === businessId) {
        setSelectedId(nextItems.length > 0 ? nextItems[0].id : null);
      }
    } finally {
      setDeletingId(null);
    }
  };

  if (loading || pageLoading) return null;
  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-stone-50">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="mb-2 font-display text-4xl font-bold text-gray-900">
                My Businesses
              </h1>
              <p className="text-gray-600">
                Edit and review all listing details, including logo, cover, and gallery.
              </p>
            </div>
            <a href="/submit" className="btn-primary">
              + Add New Listing
            </a>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-1">
              {items.length > 0 ? (
                items.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border-2 p-4 ${selectedId === item.id ? "border-emerald-600 bg-emerald-50" : "border-gray-200 bg-white"}`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className="w-full text-left"
                    >
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.tagline}</p>
                      <span className="mt-2 inline-block rounded bg-white px-2 py-1 text-xs text-emerald-700">
                        {item.status}
                      </span>
                    </button>
                    <div className="mt-3 flex gap-3">
                      <a
                        href={item.slug ? `/business/${item.slug}` : "/directory"}
                        className="text-sm font-semibold text-gray-700"
                      >
                        View Public
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="text-sm font-semibold text-red-600 disabled:opacity-50"
                      >
                        {deletingId === item.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-white p-6">
                  <p className="mb-4 text-gray-600">You have no listings yet.</p>
                  <a href="/submit" className="btn-primary">
                    Create Listing
                  </a>
                </div>
              )}
            </div>
            <div className="space-y-6 lg:col-span-2">
              {selected ? (
                <>
                  <form
                    onSubmit={handleSave}
                    className="space-y-6 rounded-2xl bg-white p-8 shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="font-display text-2xl font-bold text-gray-900">
                        Edit Listing
                      </h2>
                      {saved && (
                        <span className="text-sm font-semibold text-emerald-700">
                          Saved
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Business Name" className="w-full rounded-lg border-2 border-gray-200 px-4 py-2" />
                      <input type="text" name="slug" value={formData.slug} onChange={handleChange} placeholder="Slug" className="w-full rounded-lg border-2 border-gray-200 px-4 py-2" />
                    </div>

                    <input type="text" name="tagline" value={formData.tagline} onChange={handleChange} placeholder="Tagline" className="w-full rounded-lg border-2 border-gray-200 px-4 py-2" />
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={4} placeholder="Description" className="w-full resize-none rounded-lg border-2 border-gray-200 px-4 py-2" />
                    <input type="text" name="seoKeywords" value={formData.seoKeywords} onChange={handleChange} placeholder="SEO Keywords" className="w-full rounded-lg border-2 border-gray-200 px-4 py-2" />

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <select name="categoryId" value={formData.categoryId} onChange={handleChange} className="w-full rounded-lg border-2 border-gray-200 px-4 py-2">
                        <option value="">Select category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <select name="pricingPackageId" value={formData.pricingPackageId} onChange={handleChange} className="w-full rounded-lg border-2 border-gray-200 px-4 py-2">
                        <option value="">No package</option>
                        {packages.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="City" className="w-full rounded-lg border-2 border-gray-200 px-4 py-2" />
                      <input type="text" name="postcode" value={formData.postcode} onChange={handleChange} placeholder="Postcode" className="w-full rounded-lg border-2 border-gray-200 px-4 py-2" />
                    </div>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Address" className="w-full rounded-lg border-2 border-gray-200 px-4 py-2" />
                    <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="Country" className="w-full rounded-lg border-2 border-gray-200 px-4 py-2" />

                    <div className="space-y-4">
                      <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="w-full rounded-lg border-2 border-gray-200 px-4 py-2" />
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" className="w-full rounded-lg border-2 border-gray-200 px-4 py-2" />
                      <input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="Website" className="w-full rounded-lg border-2 border-gray-200 px-4 py-2" />
                    </div>

                    <div className="rounded-lg border-2 border-gray-200 p-4">
                      <p className="mb-2 text-sm font-semibold">Social Links</p>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <input type="url" name="socialFacebook" value={formData.socialFacebook} onChange={handleChange} placeholder="Facebook URL" className="w-full rounded-lg border border-gray-200 px-3 py-2" />
                        <input type="url" name="socialInstagram" value={formData.socialInstagram} onChange={handleChange} placeholder="Instagram URL" className="w-full rounded-lg border border-gray-200 px-3 py-2" />
                        <input type="url" name="socialLinkedin" value={formData.socialLinkedin} onChange={handleChange} placeholder="LinkedIn URL" className="w-full rounded-lg border border-gray-200 px-3 py-2" />
                        <input type="url" name="socialX" value={formData.socialX} onChange={handleChange} placeholder="X / Twitter URL" className="w-full rounded-lg border border-gray-200 px-3 py-2" />
                        <input type="url" name="socialYoutube" value={formData.socialYoutube} onChange={handleChange} placeholder="YouTube URL" className="w-full rounded-lg border border-gray-200 px-3 py-2 md:col-span-2" />
                      </div>
                    </div>

                    <div className="rounded-lg border-2 border-gray-200 p-4">
                      <p className="mb-2 text-sm font-semibold">Sustainability Features (one per line)</p>
                      <textarea name="sustainabilityText" value={formData.sustainabilityText} onChange={handleChange} rows={4} placeholder={"Plastic-free packaging\nSolar powered operations"} className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2" />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-lg border-2 border-gray-200 p-4">
                        <p className="mb-2 text-sm font-semibold">Logo</p>
                        <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleUpload("logo", file); }} />
                        {formData.logo && <img src={formData.logo} alt="Logo" className="mt-3 h-24 w-24 rounded-lg object-cover" />}
                      </div>
                      <div className="rounded-lg border-2 border-gray-200 p-4">
                        <p className="mb-2 text-sm font-semibold">Cover Image</p>
                        <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleUpload("coverImage", file); }} />
                        {formData.coverImage && <img src={formData.coverImage} alt="Cover" className="mt-3 h-24 w-full rounded-lg object-cover" />}
                      </div>
                    </div>

                    <div className="rounded-lg border-2 border-gray-200 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-semibold">Gallery Images</p>
                        <span className="text-xs text-gray-500">{formData.gallery.length} image(s)</span>
                      </div>
                      <input type="file" multiple accept="image/*" onChange={(e) => handleGalleryUpload(e.target.files)} />
                      {formData.gallery.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                          {formData.gallery.map((url, idx) => (
                            <div key={`${url}-${idx}`} className="relative">
                              <img src={url} alt={`Gallery ${idx + 1}`} className="h-20 w-full rounded-md object-cover" />
                              <button type="button" onClick={() => handleGalleryRemove(idx)} className="absolute right-1 top-1 rounded bg-black/60 px-2 py-1 text-xs text-white">
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg border-2 border-gray-200 p-4">
                      <p className="mb-2 text-sm font-semibold">Badges</p>
                      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                        {badges.map((badge) => {
                          const checked = formData.badgeIds.includes(badge.id);
                          return (
                            <label key={badge.id} className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${checked ? "border-emerald-500 bg-emerald-50" : "border-gray-200"}`}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    badgeIds: e.target.checked
                                      ? [...prev.badgeIds, badge.id]
                                      : prev.badgeIds.filter((id) => id !== badge.id),
                                  }))
                                }
                              />
                              <span>{badge.icon}</span>
                              <span>{badge.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-lg border-2 border-gray-200 p-4">
                      <p className="mb-2 text-sm font-semibold">Manage Related Items</p>
                      <div className="flex flex-wrap gap-3">
                        <a href={`/dashboard/products?businessId=${selected.id}`} className="rounded-lg border border-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-700">Edit Products</a>
                        <a href={`/dashboard/menu?businessId=${selected.id}`} className="rounded-lg border border-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-700">Edit Menu</a>
                        <a href={`/dashboard/services?businessId=${selected.id}`} className="rounded-lg border border-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-700">Edit Services</a>
                      </div>
                    </div>

                    <button type="submit" disabled={saving || uploading.logo || uploading.cover || uploading.gallery} className="w-full btn-primary disabled:opacity-50">
                      {saving
                        ? "Saving..."
                        : uploading.logo || uploading.cover || uploading.gallery
                          ? "Uploading..."
                          : "Save Changes"}
                    </button>
                  </form>

                  <div className="rounded-2xl bg-white p-8 shadow-md">
                    <h3 className="mb-4 font-display text-xl font-bold text-gray-900">Current Listing Details</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p><span className="font-semibold">Name:</span> {selected.name}</p>
                      <p><span className="font-semibold">Slug:</span> {selected.slug}</p>
                      <p><span className="font-semibold">Status:</span> {selected.status}</p>
                      <p>
                        <span className="font-semibold">Updated:</span>{" "}
                        {selected.updatedAt ? new Date(selected.updatedAt).toLocaleString() : "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold">Location:</span>{" "}
                        {[formData.address, formData.city, formData.postcode, formData.country]
                          .filter(Boolean)
                          .join(", ") || "N/A"}
                      </p>
                    </div>

                    {formData.coverImage && (
                      <div className="mt-4">
                        <p className="mb-2 text-sm font-semibold text-gray-700">Cover</p>
                        <img src={formData.coverImage} alt="Current cover" className="h-40 w-full rounded-lg object-cover" />
                      </div>
                    )}
                    {formData.logo && (
                      <div className="mt-4">
                        <p className="mb-2 text-sm font-semibold text-gray-700">Logo</p>
                        <img src={formData.logo} alt="Current logo" className="h-24 w-24 rounded-lg object-cover" />
                      </div>
                    )}
                    {formData.gallery.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-sm font-semibold text-gray-700">Gallery</p>
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                          {formData.gallery.map((url, idx) => (
                            <img key={`${url}-preview-${idx}`} src={url} alt={`Gallery preview ${idx + 1}`} className="h-20 w-full rounded-md object-cover" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl bg-white p-8 shadow-md">
                  <p className="text-gray-600">Select a listing from the left to edit.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
