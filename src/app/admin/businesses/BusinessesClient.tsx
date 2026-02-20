"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
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
  type BadgeOption,
  type BusinessFormData,
  type BusinessRow,
  type BusinessStatus,
  type CategoryOption,
  type PricingPackageOption,
  type UserOption,
} from "./types";
import { COUNTRY_OPTIONS, getCountryCode } from "./locationOptions";

interface BusinessesClientProps {
  initialBusinesses: BusinessRow[];
  categories: CategoryOption[];
  owners: UserOption[];
  badges: BadgeOption[];
  packages: PricingPackageOption[];
  standaloneForm?: boolean;
  initialEditingId?: string | null;
}

type LocationProvider = "google" | "geoapify" | "openstreetmap";

interface LocationProviderSettings {
  provider: LocationProvider;
  googleMapsApiKey: string;
  geoapifyApiKey: string;
}

const SETTINGS_STORAGE_KEY = "admin.locationProviderSettings";

function calculatePackageExpiryDate(
  createdAtIso: string,
  billingPeriod?: "monthly" | "yearly",
) {
  if (!billingPeriod) return null;
  const start = new Date(createdAtIso);
  if (Number.isNaN(start.getTime())) return null;

  const expiresAt = new Date(start);
  if (billingPeriod === "monthly") {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  } else {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  }

  return expiresAt;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(value);
}

export default function BusinessesClient({
  initialBusinesses,
  categories,
  owners,
  badges,
  packages,
  standaloneForm = false,
  initialEditingId = null,
}: BusinessesClientProps) {
  const envGeoapifyApiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || "";
  const envGoogleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const router = useRouter();
  const [allBusinesses, setAllBusinesses] =
    useState<BusinessRow[]>(initialBusinesses);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(standaloneForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BusinessFormData>(emptyForm);
  const [uploading, setUploading] = useState({
    logo: false,
    coverImage: false,
    gallery: false,
  });
  const [filter, setFilter] = useState<
    "all" | "approved" | "pending" | "rejected"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [packageFilter, setPackageFilter] = useState("all");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "name" | "expiry"
  >("newest");
  const [providerSettings, setProviderSettings] =
    useState<LocationProviderSettings>({
      provider: "geoapify",
      googleMapsApiKey: "",
      geoapifyApiKey: "",
    });
  const [mapsReady, setMapsReady] = useState(false);
  const [mapsError, setMapsError] = useState<string | null>(null);
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<any>(null);
  const [geoapifyError, setGeoapifyError] = useState<string | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<
    Array<{
      label: string;
      city: string;
      postcode: string;
      country: string;
    }>
  >([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const activeProvider = providerSettings.provider;
  const geoapifyApiKey = providerSettings.geoapifyApiKey || envGeoapifyApiKey;
  const googleMapsApiKey =
    providerSettings.googleMapsApiKey || envGoogleMapsApiKey;

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

  useEffect(() => {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Partial<LocationProviderSettings>;
      setProviderSettings((prev) => ({
        provider:
          parsed.provider === "google" ||
          parsed.provider === "geoapify" ||
          parsed.provider === "openstreetmap"
            ? parsed.provider
            : prev.provider,
        googleMapsApiKey: parsed.googleMapsApiKey || "",
        geoapifyApiKey: parsed.geoapifyApiKey || "",
      }));
    } catch {
      // ignore invalid saved settings
    }
  }, []);

  const filteredBusinesses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = allBusinesses.filter((item) => {
      const matchesStatus = filter === "all" ? true : item.status === filter;
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.slug.toLowerCase().includes(query) ||
        (item.owner?.name || "").toLowerCase().includes(query) ||
        (item.location?.city || "").toLowerCase().includes(query);
      const matchesCategory =
        categoryFilter === "all" || item.categoryId === categoryFilter;
      const matchesPackage =
        packageFilter === "all" || (item.pricingPackageId || "") === packageFilter;

      return (
        matchesStatus && matchesSearch && matchesCategory && matchesPackage
      );
    });

    return filtered.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "expiry") {
        const expiryA = calculatePackageExpiryDate(
          a.createdAt,
          a.pricingPackage?.billingPeriod,
        )?.getTime();
        const expiryB = calculatePackageExpiryDate(
          b.createdAt,
          b.pricingPackage?.billingPeriod,
        )?.getTime();
        return (expiryA || 0) - (expiryB || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [
    allBusinesses,
    categoryFilter,
    filter,
    packageFilter,
    searchQuery,
    sortBy,
  ]);
  const isUploading = uploading.logo || uploading.coverImage || uploading.gallery;

  const canSubmit = useMemo(() => {
    return Boolean(
      formData.name &&
      formData.slug &&
      formData.tagline &&
      formData.description &&
      formData.categoryId &&
      formData.ownerId &&
      formData.country &&
      formData.city,
    );
  }, [formData]);

  const selectedPackage = useMemo(
    () => packages.find((item) => item.id === formData.pricingPackageId),
    [formData.pricingPackageId, packages],
  );

  useEffect(() => {
    if (
      !showForm ||
      activeProvider === "google" ||
      !formData.country ||
      (activeProvider === "geoapify" && !geoapifyApiKey)
    ) {
      setAddressSuggestions([]);
      return;
    }

    const query = formData.address.trim();
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    const countryCode = getCountryCode(formData.country);
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        setGeoapifyError(null);

        const response =
          activeProvider === "geoapify"
            ? await (async () => {
                const params = new URLSearchParams({
                  text: query,
                  apiKey: geoapifyApiKey,
                  limit: "5",
                  format: "json",
                });
                if (countryCode) {
                  params.set("filter", `countrycode:${countryCode}`);
                }
                return fetch(
                  `https://api.geoapify.com/v1/geocode/autocomplete?${params.toString()}`,
                  { signal: controller.signal },
                );
              })()
            : await (async () => {
                const params = new URLSearchParams({
                  q: query,
                  format: "jsonv2",
                  addressdetails: "1",
                  limit: "5",
                });
                if (countryCode) {
                  params.set("countrycodes", countryCode);
                }
                return fetch(
                  `https://nominatim.openstreetmap.org/search?${params.toString()}`,
                  { signal: controller.signal },
                );
              })();

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "Failed to fetch address suggestions");
        }

        const payload = await response.json();
        const rawItems =
          activeProvider === "geoapify"
            ? Array.isArray(payload?.results)
              ? payload.results
              : Array.isArray(payload?.features)
                ? payload.features.map(
                    (feature: any) => feature?.properties || {},
                  )
                : []
            : Array.isArray(payload)
              ? payload
              : [];

        const nextSuggestions = rawItems.map((item: any) => ({
          label:
            item.formatted || item.display_name || item.address_line1 || "",
          city:
            item.city ||
            item.town ||
            item.village ||
            item.suburb ||
            item.county ||
            item.address?.city ||
            item.address?.town ||
            item.address?.village ||
            item.address?.county ||
            "",
          postcode: item.postcode || item.address?.postcode || "",
          country: item.country || item.address?.country || "",
        }));

        setAddressSuggestions(
          nextSuggestions.filter((item: any) => item.label),
        );
      } catch (autocompleteError) {
        if ((autocompleteError as Error).name === "AbortError") return;
        const message =
          autocompleteError instanceof Error
            ? autocompleteError.message
            : "Failed to load address suggestions.";
        setGeoapifyError(message);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [
    activeProvider,
    formData.address,
    formData.country,
    geoapifyApiKey,
    showForm,
  ]);

  useEffect(() => {
    if (
      !showForm ||
      activeProvider !== "google" ||
      !googleMapsApiKey ||
      !formData.country
    ) {
      return;
    }

    const existingScript = document.getElementById(
      "google-maps-places-script",
    ) as HTMLScriptElement | null;

    if ((window as any).google?.maps?.places) {
      setMapsReady(true);
      return;
    }

    const handleLoad = () => setMapsReady(true);
    const handleError = () =>
      setMapsError("Google Maps failed to load. Please try again.");

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad);
      existingScript.addEventListener("error", handleError);

      return () => {
        existingScript.removeEventListener("load", handleLoad);
        existingScript.removeEventListener("error", handleError);
      };
    }

    const script = document.createElement("script");
    script.id = "google-maps-places-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);
    document.head.appendChild(script);

    return () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };
  }, [activeProvider, formData.country, googleMapsApiKey, showForm]);

  useEffect(() => {
    if (
      activeProvider !== "google" ||
      !mapsReady ||
      !addressInputRef.current ||
      autocompleteRef.current
    ) {
      return;
    }

    const googleMaps = (window as any).google;
    if (!googleMaps?.maps?.places) return;

    const countryCode = getCountryCode(formData.country);

    autocompleteRef.current = new googleMaps.maps.places.Autocomplete(
      addressInputRef.current,
      {
        fields: ["address_components", "formatted_address"],
        types: ["address"],
        componentRestrictions: countryCode
          ? { country: countryCode }
          : undefined,
      },
    );

    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current.getPlace();
      const components: any[] = place?.address_components || [];

      const getByType = (
        type: string,
        key: "long_name" | "short_name" = "long_name",
      ) =>
        components.find(
          (c) => Array.isArray(c.types) && c.types.includes(type),
        )?.[key] || "";

      const detectedCountry = getByType("country");
      const detectedCity =
        getByType("locality") ||
        getByType("postal_town") ||
        getByType("administrative_area_level_2");
      const detectedPostcode = getByType("postal_code");
      const formattedAddress = place?.formatted_address || "";

      setFormData((prev) => ({
        ...prev,
        address: formattedAddress || prev.address,
        country: detectedCountry || prev.country,
        city: detectedCity || prev.city,
        postcode: detectedPostcode || prev.postcode,
      }));
    });
  }, [activeProvider, formData.country, mapsReady]);

  useEffect(() => {
    if (activeProvider !== "google") return;

    const autocomplete = autocompleteRef.current;
    const googleMaps = (window as any).google;
    if (!autocomplete || !googleMaps?.maps?.places) return;

    const countryCode = getCountryCode(formData.country);
    autocomplete.setComponentRestrictions(
      countryCode ? { country: countryCode } : {},
    );
  }, [activeProvider, formData.country]);

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setUploading({ logo: false, coverImage: false, gallery: false });
    setShowForm(true);
  };

  const openEdit = (item: BusinessRow) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      slug: item.slug,
      tagline: item.tagline || "",
      description: item.description || "",
      seoKeywords: item.seoKeywords || "",
      gallery: item.gallery || [],
      categoryId: item.categoryId,
      pricingPackageId: item.pricingPackageId || "",
      ownerId: item.ownerId,
      logo: item.logo || "",
      coverImage: item.coverImage || "",
      country: item.location?.country || "",
      city: item.location?.city || "",
      address: item.location?.address || "",
      postcode: item.location?.postcode || "",
      email: item.contact?.email || "",
      phone: item.contact?.phone || "",
      website: item.contact?.website || "",
      status: item.status,
      featured: Boolean(item.featured),
      badgeIds: item.badgeIds || [],
      products: item.products || [],
      menuItems: item.menuItems || [],
      services: item.services || [],
    });
    setUploading({ logo: false, coverImage: false, gallery: false });
    setShowForm(true);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const next =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => {
      const updated = { ...prev, [name]: next } as BusinessFormData;
      if (name === "name" && !editingId) {
        updated.slug = slugify(value);
      }
      if (name === "pricingPackageId") {
        const nextPackage = packages.find((item) => item.id === value);
        if (
          nextPackage &&
          updated.gallery.length > Math.max(nextPackage.galleryLimit, 0)
        ) {
          updated.gallery = updated.gallery.slice(
            0,
            Math.max(nextPackage.galleryLimit, 0),
          );
        }
      }
      if (name === "country") {
        updated.address = "";
        updated.city = "";
        updated.postcode = "";
        setAddressSuggestions([]);
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

      if (standaloneForm) {
        router.push("/admin/businesses");
      } else {
        setShowForm(false);
        setEditingId(null);
        setFormData(emptyForm);
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unexpected error",
      );
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!standaloneForm) return;
    if (initialEditingId) {
      const target = initialBusinesses.find((item) => item.id === initialEditingId);
      if (target) {
        openEdit(target);
        return;
      }
    }
    openCreate();
  }, [initialEditingId, initialBusinesses, standaloneForm]);

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

    const payload = await response.json();
    if (!response.ok || !payload?.url) {
      throw new Error(payload?.error || "Upload failed.");
    }

    return payload.url as string;
  };

  const handleImageUpload = async (field: "logo" | "coverImage", file: File) => {
    try {
      setError(null);
      setUploading((prev) => ({ ...prev, [field]: true }));
      const url = await uploadBusinessImage(
        field === "logo" ? "logo" : "cover",
        file,
      );
      setFormData((prev) => ({ ...prev, [field]: url }));
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed.",
      );
    } finally {
      setUploading((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      setError(null);
      const limit = selectedPackage ? Math.max(selectedPackage.galleryLimit, 0) : null;
      const remaining =
        typeof limit === "number" ? limit - formData.gallery.length : Number.MAX_SAFE_INTEGER;

      if (remaining <= 0) {
        setError("Gallery limit reached for the selected pricing package.");
        return;
      }

      const filesToUpload = Array.from(files).slice(0, remaining);
      if (filesToUpload.length < files.length) {
        setError(
          `Only ${remaining} more image${remaining === 1 ? "" : "s"} can be added for this package.`,
        );
      }

      setUploading((prev) => ({ ...prev, gallery: true }));

      const nextUrls = await Promise.all(
        filesToUpload.map((file) => uploadBusinessImage("gallery", file)),
      );

      setFormData((prev) => ({
        ...prev,
        gallery: [...prev.gallery, ...nextUrls],
      }));
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed.",
      );
    } finally {
      setUploading((prev) => ({ ...prev, gallery: false }));
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

  const updateProductField = (
    index: number,
    field: "name" | "description" | "price" | "image" | "inStock",
    value: string | number | boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const updateServiceField = (
    index: number,
    field: "name" | "description" | "pricing",
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const updateMenuItemField = (
    index: number,
    field: "category" | "name" | "description" | "price" | "dietary",
    value: string | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      menuItems: prev.menuItems.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        if (field === "dietary") {
          return {
            ...item,
            dietary: String(value)
              .split(",")
              .map((entry) => entry.trim())
              .filter(Boolean),
          };
        }
        return { ...item, [field]: value };
      }),
    }));
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
                {standaloneForm
                  ? editingId
                    ? "Edit Business"
                    : "Add New Business"
                  : "Manage Businesses"}
              </h1>
              <p className="text-gray-600">
                {standaloneForm
                  ? "Fill in the business details and save."
                  : "Load businesses from database and manage CRUD operations."}
              </p>
            </div>
            {!standaloneForm && (
              <button
                onClick={() => router.push("/admin/businesses/new")}
                className="btn-primary"
              >
                + Add Business
              </button>
            )}
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
                <div className="mb-1">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Basic Details
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">
                      Business Name
                    </label>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Business name"
                      className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">
                      Slug
                    </label>
                    <input
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      placeholder="Slug"
                      className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">
                      Owner
                    </label>
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
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">
                      Category
                    </label>
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
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Pricing Package
                  </label>
                  <select
                    name="pricingPackageId"
                    value={formData.pricingPackageId}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">No pricing package</option>
                    {packages.map((pack) => (
                      <option key={pack.id} value={pack.id}>
                        {pack.name}
                        {!pack.active ? " (inactive)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Tagline
                  </label>
                  <input
                    name="tagline"
                    value={formData.tagline}
                    onChange={handleChange}
                    placeholder="Tagline"
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Description"
                    className="w-full resize-none rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    SEO Keywords
                  </label>
                  <input
                    name="seoKeywords"
                    value={formData.seoKeywords}
                    onChange={handleChange}
                    placeholder="SEO keywords (comma-separated)"
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <p className="-mt-2 text-xs text-gray-500">
                  Auto keywords include business name and category. Add extra
                  manual keywords here, separated by commas.
                </p>

                <div className="mb-1 pt-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Location & Contact
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    required
                  >
                    <option value="">Select country</option>
                    {COUNTRY_OPTIONS.map((country) => (
                      <option key={country.code} value={country.name}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                  <input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City (auto-filled from Google)"
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    name="address"
                    ref={addressInputRef}
                    value={formData.address}
                    onChange={handleChange}
                    placeholder={
                      activeProvider === "google"
                        ? formData.country
                          ? "Start typing address (Google autocomplete)"
                          : "Select country first"
                        : activeProvider === "geoapify"
                          ? formData.country
                            ? "Start typing address (Geoapify autocomplete)"
                            : "Select country first"
                          : formData.country
                            ? "Start typing address (OpenStreetMap search)"
                            : "Select country first"
                    }
                    disabled={
                      (activeProvider === "google" && !formData.country) ||
                      (activeProvider === "geoapify" &&
                        Boolean(geoapifyApiKey) &&
                        !formData.country)
                    }
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

                {activeProvider !== "google" &&
                  addressSuggestions.length > 0 && (
                    <div className="max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white">
                      {addressSuggestions.map((item) => (
                        <button
                          key={`${item.label}-${item.postcode}`}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              address: item.label,
                              city: item.city || prev.city,
                              postcode: item.postcode || prev.postcode,
                              country: item.country || prev.country,
                            }));
                            setAddressSuggestions([]);
                          }}
                          className="w-full border-b border-gray-100 px-3 py-2 text-left text-sm text-gray-700 hover:bg-emerald-50"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}

                {activeProvider !== "google" && loadingSuggestions && (
                  <p className="text-sm text-gray-500">
                    Loading suggestions...
                  </p>
                )}
                {activeProvider === "google" && mapsError && (
                  <p className="text-sm text-amber-700">{mapsError}</p>
                )}
                {activeProvider !== "google" && geoapifyError && (
                  <p className="text-sm text-amber-700">{geoapifyError}</p>
                )}
                {activeProvider === "geoapify" && !geoapifyApiKey && (
                  <p className="text-sm text-gray-500">
                    Add Geoapify key in <code>/admin/settings</code> or
                    <code> NEXT_PUBLIC_GEOAPIFY_API_KEY</code>.
                  </p>
                )}
                {activeProvider === "google" && !googleMapsApiKey && (
                  <p className="text-sm text-gray-500">
                    Add Google key in <code>/admin/settings</code> or
                    <code> NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>.
                  </p>
                )}
                {activeProvider === "openstreetmap" && (
                  <p className="text-sm text-gray-500">
                    OpenStreetMap autocomplete uses Nominatim public endpoint.
                  </p>
                )}

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

                <div className="mb-1 pt-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Media
                  </h3>
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
                      <p className="mt-2 text-xs text-emerald-700">
                        Uploading...
                      </p>
                    )}
                    {formData.logo && (
                      <div className="mt-3">
                        <Image
                          src={formData.logo}
                          alt="Business logo preview"
                          width={80}
                          height={80}
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
                      <p className="mt-2 text-xs text-emerald-700">
                        Uploading...
                      </p>
                    )}
                    {formData.coverImage && (
                      <div className="mt-3">
                        <Image
                          src={formData.coverImage}
                          alt="Business cover preview"
                          width={320}
                          height={80}
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

                <div className="rounded-lg border-2 border-gray-200 p-4">
                  <p className="mb-2 text-sm font-semibold text-gray-700">
                    Gallery Images
                  </p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    onChange={(e) => {
                      handleGalleryUpload(e.target.files);
                      e.currentTarget.value = "";
                    }}
                    className="w-full text-sm"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Add multiple images. JPG, PNG, WEBP, or GIF up to 5MB each.
                  </p>
                  {selectedPackage && (
                    <p className="mt-1 text-xs text-emerald-700">
                      Plan limit: {selectedPackage.galleryLimit} image
                      {selectedPackage.galleryLimit === 1 ? "" : "s"} (currently{" "}
                      {formData.gallery.length})
                    </p>
                  )}
                  {uploading.gallery && (
                    <p className="mt-2 text-xs text-emerald-700">Uploading...</p>
                  )}
                  {formData.gallery.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                      {formData.gallery.map((url, index) => (
                        <div key={`${url}-${index}`} className="rounded-md border p-2">
                          <Image
                            src={url}
                            alt={`Gallery image ${index + 1}`}
                            width={180}
                            height={120}
                            className="h-24 w-full rounded object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                gallery: prev.gallery.filter((_, i) => i !== index),
                              }))
                            }
                            className="mt-2 text-xs font-semibold text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mb-1 pt-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Products, Services & Menu
                  </h3>
                </div>

                <div className="rounded-lg border-2 border-gray-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">Products</p>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          products: [
                            ...prev.products,
                            {
                              name: "",
                              description: "",
                              price: 0,
                              image: "",
                              inStock: true,
                            },
                          ],
                        }))
                      }
                      className="rounded-md border border-emerald-300 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                    >
                      + Add Product
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.products.map((product, index) => (
                      <div
                        key={`product-${index}`}
                        className="rounded-md border border-gray-200 p-3"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            value={product.name}
                            onChange={(e) =>
                              updateProductField(index, "name", e.target.value)
                            }
                            placeholder="Product name"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={product.price}
                            onChange={(e) =>
                              updateProductField(
                                index,
                                "price",
                                Number(e.target.value || 0),
                              )
                            }
                            placeholder="Price"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                        <input
                          value={product.description}
                          onChange={(e) =>
                            updateProductField(index, "description", e.target.value)
                          }
                          placeholder="Product description"
                          className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                        />
                        <input
                          value={product.image}
                          onChange={(e) =>
                            updateProductField(index, "image", e.target.value)
                          }
                          placeholder="Image URL (optional)"
                          className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                        />
                        <div className="mt-3 flex items-center justify-between">
                          <label className="flex items-center gap-2 text-sm text-gray-600">
                            <input
                              type="checkbox"
                              checked={product.inStock}
                              onChange={(e) =>
                                updateProductField(index, "inStock", e.target.checked)
                              }
                            />
                            In stock
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                products: prev.products.filter(
                                  (_, itemIndex) => itemIndex !== index,
                                ),
                              }))
                            }
                            className="text-xs font-semibold text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    {formData.products.length === 0 && (
                      <p className="text-sm text-gray-500">No products added yet.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border-2 border-gray-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">Services</p>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          services: [
                            ...prev.services,
                            { name: "", description: "", pricing: "" },
                          ],
                        }))
                      }
                      className="rounded-md border border-emerald-300 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                    >
                      + Add Service
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.services.map((service, index) => (
                      <div
                        key={`service-${index}`}
                        className="rounded-md border border-gray-200 p-3"
                      >
                        <input
                          value={service.name}
                          onChange={(e) =>
                            updateServiceField(index, "name", e.target.value)
                          }
                          placeholder="Service name"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                        />
                        <input
                          value={service.description}
                          onChange={(e) =>
                            updateServiceField(index, "description", e.target.value)
                          }
                          placeholder="Service description"
                          className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                        />
                        <div className="mt-3 flex items-center gap-3">
                          <input
                            value={service.pricing}
                            onChange={(e) =>
                              updateServiceField(index, "pricing", e.target.value)
                            }
                            placeholder="Pricing (e.g. From £45)"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                services: prev.services.filter(
                                  (_, itemIndex) => itemIndex !== index,
                                ),
                              }))
                            }
                            className="text-xs font-semibold text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    {formData.services.length === 0 && (
                      <p className="text-sm text-gray-500">No services added yet.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border-2 border-gray-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">Menu Items</p>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          menuItems: [
                            ...prev.menuItems,
                            {
                              category: "",
                              name: "",
                              description: "",
                              price: 0,
                              dietary: [],
                            },
                          ],
                        }))
                      }
                      className="rounded-md border border-emerald-300 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                    >
                      + Add Menu Item
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.menuItems.map((menuItem, index) => (
                      <div
                        key={`menu-item-${index}`}
                        className="rounded-md border border-gray-200 p-3"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            value={menuItem.category}
                            onChange={(e) =>
                              updateMenuItemField(index, "category", e.target.value)
                            }
                            placeholder="Category (e.g. Main, Drinks)"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={menuItem.price}
                            onChange={(e) =>
                              updateMenuItemField(
                                index,
                                "price",
                                Number(e.target.value || 0),
                              )
                            }
                            placeholder="Price"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                        <input
                          value={menuItem.name}
                          onChange={(e) =>
                            updateMenuItemField(index, "name", e.target.value)
                          }
                          placeholder="Menu item name"
                          className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                        />
                        <input
                          value={menuItem.description}
                          onChange={(e) =>
                            updateMenuItemField(index, "description", e.target.value)
                          }
                          placeholder="Menu item description"
                          className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                        />
                        <div className="mt-3 flex items-center gap-3">
                          <input
                            value={menuItem.dietary.join(", ")}
                            onChange={(e) =>
                              updateMenuItemField(index, "dietary", e.target.value)
                            }
                            placeholder="Dietary tags, comma separated"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                menuItems: prev.menuItems.filter(
                                  (_, itemIndex) => itemIndex !== index,
                                ),
                              }))
                            }
                            className="text-xs font-semibold text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    {formData.menuItems.length === 0 && (
                      <p className="text-sm text-gray-500">No menu items added yet.</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">
                      Listing Status
                    </label>
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
                  </div>
                  <label className="flex items-center gap-2 rounded-lg border-2 border-gray-200 px-4 py-2">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={formData.featured}
                      onChange={handleChange}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Featured
                    </span>
                  </label>
                </div>

                <div className="rounded-lg border-2 border-gray-200 p-4">
                  <p className="mb-3 text-sm font-semibold text-gray-700">
                    Badges
                  </p>
                  {badges.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                      {badges.map((badge) => {
                        const checked = formData.badgeIds.includes(badge.id);

                        return (
                          <label
                            key={badge.id}
                            className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                              checked
                                ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                                : "border-gray-200 bg-white text-gray-700"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  badgeIds: e.target.checked
                                    ? [...prev.badgeIds, badge.id]
                                    : prev.badgeIds.filter(
                                        (id) => id !== badge.id,
                                      ),
                                }));
                              }}
                            />
                            <span>{badge.icon}</span>
                            <span>{badge.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No badges found. Create badges first from the badges page.
                    </p>
                  )}
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
                      if (standaloneForm) {
                        router.push("/admin/businesses");
                      } else {
                        setShowForm(false);
                        setEditingId(null);
                        setFormData(emptyForm);
                        setUploading({
                          logo: false,
                          coverImage: false,
                          gallery: false,
                        });
                      }
                    }}
                    className="rounded-lg border-2 border-gray-200 px-4 py-2 text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {!standaloneForm && <div className="mb-8 flex gap-2">
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
          </div>}

          {!standaloneForm && (
            <div className="mb-6 grid grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow-sm md:grid-cols-4">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search business, slug, owner, city"
                className="rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                value={packageFilter}
                onChange={(e) => setPackageFilter(e.target.value)}
                className="rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
              >
                <option value="all">All packages</option>
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as "newest" | "oldest" | "name" | "expiry",
                  )
                }
                className="rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
              >
                <option value="newest">Sort: Newest</option>
                <option value="oldest">Sort: Oldest</option>
                <option value="name">Sort: Name A-Z</option>
                <option value="expiry">Sort: Expiry</option>
              </select>
            </div>
          )}

          {!standaloneForm && (filteredBusinesses.length > 0 ? (
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
                        Package
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Expires
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Badges
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBusinesses.map((business, idx) => {
                      const packageExpiryDate = calculatePackageExpiryDate(
                        business.createdAt,
                        business.pricingPackage?.billingPeriod,
                      );
                      return (
                      <tr
                        key={business.id}
                        className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">
                            {business.name}
                          </p>
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
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {business.pricingPackage?.name || "No package"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {packageExpiryDate
                            ? formatDate(packageExpiryDate)
                            : "N/A"}
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
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {business.badges.length > 0
                            ? business.badges
                                .slice(0, 2)
                                .map((item) => `${item.icon} ${item.name}`)
                                .join(", ")
                            : "None"}
                          {business.badges.length > 2 &&
                            ` +${business.badges.length - 2}`}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEdit(business)}
                              className="rounded-lg bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700 hover:bg-indigo-200"
                            >
                              Quick Edit
                            </button>
                            <button
                              onClick={() => router.push(`/admin/businesses/${business.id}`)}
                              className="rounded-lg bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 hover:bg-blue-200"
                            >
                              Edit
                            </button>
                            <label className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                              <input
                                type="checkbox"
                                checked={business.status === "approved"}
                                onChange={(e) =>
                                  handleStatusChange(
                                    business.id,
                                    e.target.checked ? "approved" : "pending",
                                  )
                                }
                              />
                              {business.status === "approved"
                                ? "Published"
                                : "Unpublished"}
                            </label>
                            <button
                              onClick={() => handleDelete(business.id)}
                              className="rounded-lg bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
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
          ))}
        </div>
      </main>
    </div>
  );
}
