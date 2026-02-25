"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import Footer from "@/components/public/Footer";
import Navbar from "@/components/public/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { badges, categories } from "@/data/mockData";
import {
  COUNTRY_OPTIONS,
  getCountryCode,
} from "@/app/admin/businesses/locationOptions";
import { slugify } from "@/app/admin/businesses/types";
import {
  getPackageFeatureLabel,
  normalizePackageFeatures,
  type PackageFeatureKey,
} from "@/lib/package-features";
import { getBillingDurationLabel } from "@/lib/pricing-duration";

type Step = 1 | 2 | 3;
type AccountMode = "signin" | "signup";
type LocationProvider = "google" | "geoapify" | "openstreetmap";
type PaymentMode = "subscription" | "one_time";
type ProductInput = {
  name: string;
  description: string;
  price: number;
  image: string;
  purchaseLink: string;
  inStock: boolean;
};
type MenuItemInput = { category: string; name: string; description: string; price: number; dietary: string[] };
type ServiceInput = { name: string; description: string; pricing: string };
type PricingPackage = {
  id: string;
  name: string;
  price: number;
  billingPeriod: "monthly" | "yearly";
  durationDays: number;
  description: string;
  features: string[];
  galleryLimit: number;
  featured: boolean;
  active: boolean;
};

const SETTINGS_STORAGE_KEY = "admin.locationProviderSettings";
const PENDING_LISTING_STORAGE_KEY = "submit.pendingListing";

export default function SubmitPage() {
  const { isAuthenticated, user, login } = useAuth();
  const [pricingPackages, setPricingPackages] = useState<PricingPackage[]>([]);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [pricingError, setPricingError] = useState("");
  const [step, setStep] = useState<Step>(1);
  const [accountMode, setAccountMode] = useState<AccountMode>("signin");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("subscription");
  const [uploading, setUploading] = useState({ logo: false, cover: false, gallery: false });

  const [provider, setProvider] = useState<LocationProvider>("geoapify");
  const [geoapifyKey, setGeoapifyKey] = useState(process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || "");
  const [googleKey, setGoogleKey] = useState(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "");
  const [mapsReady, setMapsReady] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [mapsError, setMapsError] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ label: string; city: string; postcode: string; country: string }>>([]);
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<any>(null);

  const [formData, setFormData] = useState({
    businessName: "",
    slug: "",
    tagline: "",
    description: "",
    seoKeywords: "",
    categoryId: "",
    country: "",
    city: "",
    address: "",
    postcode: "",
    email: "",
    phone: "",
    website: "",
    logo: "",
    coverImage: "",
    gallery: [] as string[],
    badgeIds: [] as string[],
    products: [] as ProductInput[],
    menuItems: [] as MenuItemInput[],
    services: [] as ServiceInput[],
  });

  const [signinData, setSigninData] = useState({ identifier: "", password: "" });
  const [signupData, setSignupData] = useState({ name: "", username: "", email: "", password: "" });

  useEffect(() => {
    let active = true;

    const loadPricingPackages = async () => {
      try {
        setPricingLoading(true);
        setPricingError("");

        const response = await fetch("/api/pricing");
        const payload = (await response.json().catch(() => [])) as
          | PricingPackage[]
          | { error?: string };

        if (!response.ok) {
          throw new Error(
            !Array.isArray(payload)
              ? payload.error || "Failed to load pricing packages."
              : "Failed to load pricing packages.",
          );
        }

        if (!active) return;

        const rows = Array.isArray(payload) ? payload : [];
        const filtered = rows
          .filter((item) => item.active)
          .sort((a, b) => {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return a.price - b.price;
          });

        setPricingPackages(filtered);
      } catch (err) {
        if (!active) return;
        setPricingPackages([]);
        setPricingError(
          err instanceof Error ? err.message : "Failed to load pricing packages.",
        );
      } finally {
        if (!active) return;
        setPricingLoading(false);
      }
    };

    void loadPricingPackages();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed.provider) setProvider(parsed.provider);
      if (parsed.geoapifyApiKey) setGeoapifyKey(parsed.geoapifyApiKey);
      if (parsed.googleMapsApiKey) setGoogleKey(parsed.googleMapsApiKey);
    } catch {}
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "cancelled") {
      setMessage("Payment was cancelled. You can try checkout again.");
    }
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    setFormData((prev) => ({ ...prev, email: prev.email || user.email }));
  }, [user?.email]);

  const onInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value } as typeof prev;
      if (name === "businessName") next.slug = slugify(value);
      if (name === "country") {
        next.address = "";
        next.city = "";
        next.postcode = "";
        setSuggestions([]);
      }
      return next;
    });
  };

  const addProduct = () => setFormData((prev) => ({ ...prev, products: [...prev.products, { name: "", description: "", price: 0, image: "", purchaseLink: "", inStock: true }] }));
  const addMenuItem = () => setFormData((prev) => ({ ...prev, menuItems: [...prev.menuItems, { category: "", name: "", description: "", price: 0, dietary: [] }] }));
  const addService = () => setFormData((prev) => ({ ...prev, services: [...prev.services, { name: "", description: "", pricing: "" }] }));
  const selectedPackageDetails =
    pricingPackages.find((item) => item.id === selectedPackage) || null;
  const selectedPackageFeatures = normalizePackageFeatures(
    selectedPackageDetails?.features || [],
  );
  const hasFeature = (feature: PackageFeatureKey) =>
    selectedPackageFeatures.includes(feature);

  useEffect(() => {
    const featureSet = new Set<PackageFeatureKey>(selectedPackageFeatures);
    setFormData((prev) => {
      let changed = false;
      const next = { ...prev };

      if (!featureSet.has("branding")) {
        if (next.logo || next.coverImage) changed = true;
        next.logo = "";
        next.coverImage = "";
      }
      if (!featureSet.has("gallery") && next.gallery.length > 0) {
        changed = true;
        next.gallery = [];
      }
      if (!featureSet.has("badges") && next.badgeIds.length > 0) {
        changed = true;
        next.badgeIds = [];
      }
      if (!featureSet.has("products") && next.products.length > 0) {
        changed = true;
        next.products = [];
      }
      if (!featureSet.has("menu_items") && next.menuItems.length > 0) {
        changed = true;
        next.menuItems = [];
      }
      if (!featureSet.has("services") && next.services.length > 0) {
        changed = true;
        next.services = [];
      }

      return changed ? next : prev;
    });
  }, [selectedPackageFeatures]);

  useEffect(() => {
    if (step !== 3 || provider === "google" || !formData.country) return;
    const q = formData.address.trim();
    if (q.length < 3) return setSuggestions([]);
    const countryCode = getCountryCode(formData.country);
    const t = setTimeout(async () => {
      try {
        setGeoError("");
        const res = provider === "geoapify"
          ? await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?${new URLSearchParams({ text: q, apiKey: geoapifyKey, limit: "5", format: "json", ...(countryCode ? { filter: `countrycode:${countryCode}` } : {}) }).toString()}`)
          : await fetch(`https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q, format: "jsonv2", addressdetails: "1", limit: "5", ...(countryCode ? { countrycodes: countryCode } : {}) }).toString()}`);
        if (!res.ok) throw new Error("Address lookup failed");
        const payload = await res.json();
        const rows = provider === "geoapify" ? payload?.results || [] : Array.isArray(payload) ? payload : [];
        setSuggestions(rows.map((item: any) => ({
          label: item.formatted || item.display_name || "",
          city: item.city || item.town || item.village || item.address?.city || item.address?.town || "",
          postcode: item.postcode || item.address?.postcode || "",
          country: item.country || item.address?.country || "",
        })).filter((i: any) => i.label));
      } catch (err) {
        setGeoError(err instanceof Error ? err.message : "Address lookup failed");
      }
    }, 300);
    return () => clearTimeout(t);
  }, [step, provider, formData.address, formData.country, geoapifyKey]);

  useEffect(() => {
    if (step !== 3 || provider !== "google" || !googleKey || !formData.country) return;
    if ((window as any).google?.maps?.places) return setMapsReady(true);
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapsReady(true);
    script.onerror = () => setMapsError("Google Maps failed to load.");
    document.head.appendChild(script);
  }, [step, provider, googleKey, formData.country]);

  useEffect(() => {
    if (step !== 3 || provider !== "google" || !mapsReady || !addressInputRef.current || autocompleteRef.current) return;
    const g = (window as any).google;
    if (!g?.maps?.places) return;
    autocompleteRef.current = new g.maps.places.Autocomplete(addressInputRef.current, {
      fields: ["address_components", "formatted_address"],
      types: ["address"],
      componentRestrictions: getCountryCode(formData.country) ? { country: getCountryCode(formData.country) } : undefined,
    });
    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current.getPlace();
      const components: any[] = place?.address_components || [];
      const getBy = (type: string) => components.find((c) => c.types?.includes(type))?.long_name || "";
      setFormData((prev) => ({
        ...prev,
        address: place?.formatted_address || prev.address,
        country: getBy("country") || prev.country,
        city: getBy("locality") || getBy("postal_town") || getBy("administrative_area_level_2") || prev.city,
        postcode: getBy("postal_code") || prev.postcode,
      }));
    });
  }, [step, provider, mapsReady, formData.country]);

  const uploadImage = async (kind: "logo" | "cover" | "gallery", file: File) => {
    const data = new FormData();
    data.append("file", file);
    data.append("kind", kind);
    const res = await fetch("/api/uploads/business-image", { method: "POST", body: data });
    const payload = await res.json();
    if (!res.ok || !payload?.url) throw new Error(payload?.error || "Upload failed");
    return payload.url as string;
  };

  const onUpload = async (field: "logo" | "coverImage", file: File) => {
    try {
      setError("");
      setUploading((p) => ({ ...p, [field === "logo" ? "logo" : "cover"]: true }));
      const url = await uploadImage(field === "logo" ? "logo" : "cover", file);
      setFormData((p) => ({ ...p, [field]: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading((p) => ({ ...p, [field === "logo" ? "logo" : "cover"]: false }));
    }
  };

  const onUploadGallery = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      setUploading((p) => ({ ...p, gallery: true }));
      const urls = await Promise.all(Array.from(files).map((f) => uploadImage("gallery", f)));
      setFormData((p) => ({ ...p, gallery: [...p.gallery, ...urls] }));
    } finally {
      setUploading((p) => ({ ...p, gallery: false }));
    }
  };

  const onUploadProductImage = async (index: number, file: File) => {
    try {
      setError("");
      setUploading((p) => ({ ...p, gallery: true }));
      const url = await uploadImage("gallery", file);
      setFormData((prev) => {
        const next = [...prev.products];
        next[index] = { ...next[index], image: url };
        return { ...prev, products: next };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Product image upload failed");
    } finally {
      setUploading((p) => ({ ...p, gallery: false }));
    }
  };

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const ok = await login(signinData.identifier, signinData.password);
    setSubmitting(false);
    if (!ok) return setError("Could not sign in. Check credentials or verify email.");
    setStep(3);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...signupData, role: "guest" }),
    });
    const payload = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) return setError(payload.error || "Account creation failed");
    setAccountMode("signin");
    setSigninData((p) => ({ ...p, identifier: signupData.email }));
    setMessage("Account created as guest. Verify email, sign in, then submit listing.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return setError("Sign in first.");
    if (!formData.businessName || !formData.tagline || !formData.description || !formData.categoryId || !formData.city || !formData.email) {
      return setError("Fill required fields.");
    }
    setSubmitting(true);
    setError("");
    const payload = { ...formData, selectedPackage, paymentMode };

    if (selectedPackage) {
      const checkoutRes = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedPackage, paymentMode }),
      });
      const checkoutPayload = await checkoutRes.json().catch(() => ({}));

      if (!checkoutRes.ok) {
        setSubmitting(false);
        return setError(checkoutPayload.error || "Failed to start payment.");
      }

      if (!checkoutPayload?.noPaymentRequired && checkoutPayload?.url) {
        sessionStorage.setItem(
          PENDING_LISTING_STORAGE_KEY,
          JSON.stringify(payload),
        );
        window.location.href = checkoutPayload.url as string;
        return;
      }

      if (!checkoutPayload?.noPaymentRequired && !checkoutPayload?.url) {
        setSubmitting(false);
        return setError("Failed to get Stripe checkout URL.");
      }
    }

    const res = await fetch("/api/submit-listing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const responsePayload = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      const details = responsePayload?.details;
      if (details && typeof details === "object") {
        const firstIssue = Object.entries(details).find(([, v]) => Array.isArray(v) && v.length > 0) as [string, string[]] | undefined;
        if (firstIssue) return setError(`${firstIssue[0]}: ${firstIssue[1][0]}`);
      }
      return setError(responsePayload.error || "Failed to submit.");
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
          <div className="max-w-lg text-center bg-white rounded-2xl shadow-lg p-10">
            <div className="text-6xl mb-4">✓</div>
            <h1 className="font-display text-3xl font-bold text-gray-900 mb-4">Listing Submitted</h1>
            <p className="text-gray-600 mb-8">Your listing with full details is pending review.</p>
            <Link href="/dashboard" className="btn-primary">Go to Dashboard</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-stone-50 py-12 px-4">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">Add Your Listing</h1>
          <p className="text-gray-600 text-lg mb-8">Full business submission with media and location search.</p>
          <div className="mb-6 flex gap-2">{[1, 2, 3].map((s) => <div key={s} className={`h-2 flex-1 rounded-full ${s <= step ? "bg-emerald-600" : "bg-gray-200"}`} />)}</div>
          {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {message && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}

          {step === 1 && (
            <>
              {pricingLoading ? (
                <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  Loading pricing packages...
                </div>
              ) : pricingError ? (
                <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {pricingError}
                </div>
              ) : pricingPackages.length === 0 ? (
                <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  No active pricing packages found. Please enable at least one package in admin.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {pricingPackages.map((pkg) => (
                    <button key={pkg.id} type="button" onClick={() => setSelectedPackage(pkg.id)} className={`text-left rounded-xl p-5 border-2 ${selectedPackage === pkg.id ? "border-emerald-600 bg-emerald-50" : "border-gray-200 hover:border-emerald-300"}`}>
                      <h3 className="font-semibold text-lg text-gray-900">{pkg.name}</h3>
                      <p className="text-emerald-700 font-bold">
                       ${pkg.price}/{getBillingDurationLabel(pkg.billingPeriod, pkg.durationDays)}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">{pkg.description}</p>
                    </button>
                  ))}
                </div>
              )}
              {selectedPackageDetails && (
                <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="mb-2 text-sm font-semibold text-emerald-900">
                    Enabled features in {selectedPackageDetails.name}
                  </p>
                  {selectedPackageFeatures.length > 0 ? (
                    <ul className="grid grid-cols-1 gap-1 md:grid-cols-2">
                      {selectedPackageFeatures.map((feature) => (
                        <li
                          key={feature}
                          className="text-sm text-emerald-800"
                        >
                          - {getPackageFeatureLabel(feature)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-emerald-800">No features enabled.</p>
                  )}
                </div>
              )}
              <div className="mb-6 rounded-xl border border-gray-200 p-4">
                <p className="mb-3 text-sm font-semibold text-gray-800">Payment Type</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMode("subscription")}
                    className={`rounded-lg border px-4 py-3 text-left ${paymentMode === "subscription" ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-700 hover:border-emerald-300"}`}
                  >
                    <p className="font-semibold">Subscription</p>
                    <p className="text-xs">Recurring billing based on selected plan period.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode("one_time")}
                    className={`rounded-lg border px-4 py-3 text-left ${paymentMode === "one_time" ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-700 hover:border-emerald-300"}`}
                  >
                    <p className="font-semibold">One-time Payment</p>
                    <p className="text-xs">Pay once for this listing submission.</p>
                  </button>
                </div>
              </div>
              <button type="button" onClick={() => selectedPackage && setStep(2)} disabled={!selectedPackage || pricingLoading || pricingPackages.length === 0} className="w-full btn-primary disabled:opacity-50">Continue to Account</button>
            </>
          )}

          {step === 2 && (
            <>
              {isAuthenticated ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="text-sm text-emerald-700">Signed in as</p>
                  <p className="font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-sm text-gray-700">{user?.email}</p>
                  <button type="button" onClick={() => setStep(3)} className="mt-4 btn-primary">Continue to Listing</button>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex rounded-lg border border-gray-200 p-1">
                    <button type="button" onClick={() => setAccountMode("signin")} className={`flex-1 rounded-md py-2 text-sm font-semibold ${accountMode === "signin" ? "bg-emerald-600 text-white" : "text-gray-600"}`}>Sign in</button>
                    <button type="button" onClick={() => setAccountMode("signup")} className={`flex-1 rounded-md py-2 text-sm font-semibold ${accountMode === "signup" ? "bg-emerald-600 text-white" : "text-gray-600"}`}>Create account</button>
                  </div>
                  {accountMode === "signin" ? (
                    <form onSubmit={handleSignin} className="space-y-4">
                      <input type="text" required placeholder="Email or username" value={signinData.identifier} onChange={(e) => setSigninData((p) => ({ ...p, identifier: e.target.value }))} className="w-full rounded-lg border-2 border-gray-200 px-4 py-3" />
                      <input type="password" required placeholder="Password" value={signinData.password} onChange={(e) => setSigninData((p) => ({ ...p, password: e.target.value }))} className="w-full rounded-lg border-2 border-gray-200 px-4 py-3" />
                      <button type="submit" disabled={submitting} className="w-full btn-primary disabled:opacity-50">{submitting ? "Signing in..." : "Sign in and continue"}</button>
                    </form>
                  ) : (
                    <form onSubmit={handleSignup} className="space-y-4">
                      <input type="text" required placeholder="Full name" value={signupData.name} onChange={(e) => setSignupData((p) => ({ ...p, name: e.target.value }))} className="w-full rounded-lg border-2 border-gray-200 px-4 py-3" />
                      <input type="text" placeholder="Username (optional)" value={signupData.username} onChange={(e) => setSignupData((p) => ({ ...p, username: e.target.value }))} className="w-full rounded-lg border-2 border-gray-200 px-4 py-3" />
                      <input type="email" required placeholder="Email" value={signupData.email} onChange={(e) => setSignupData((p) => ({ ...p, email: e.target.value }))} className="w-full rounded-lg border-2 border-gray-200 px-4 py-3" />
                      <input type="password" minLength={8} required placeholder="Password" value={signupData.password} onChange={(e) => setSignupData((p) => ({ ...p, password: e.target.value }))} className="w-full rounded-lg border-2 border-gray-200 px-4 py-3" />
                      <button type="submit" disabled={submitting} className="w-full btn-primary disabled:opacity-50">{submitting ? "Creating..." : "Create account"}</button>
                    </form>
                  )}
                  <div className="my-5 flex items-center gap-3"><div className="h-px flex-1 bg-gray-200" /><span className="text-xs uppercase text-gray-500">or</span><div className="h-px flex-1 bg-gray-200" /></div>
                  <button type="button" onClick={() => signIn("google", { callbackUrl: "/submit" })} className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50">Continue with Google</button>
                </>
              )}
              <button type="button" onClick={() => setStep(1)} className="mt-6 w-full rounded-lg border-2 border-emerald-600 px-6 py-3 font-semibold text-emerald-600 hover:bg-emerald-50">Back</button>
            </>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="businessName" value={formData.businessName} onChange={onInput} placeholder="Business name *" required className="rounded-lg border-2 border-gray-200 px-4 py-3" />
                <input name="slug" value={formData.slug} onChange={onInput} placeholder="Slug *" required className="rounded-lg border-2 border-gray-200 px-4 py-3" />
              </div>
              <input name="tagline" value={formData.tagline} onChange={onInput} placeholder="Tagline *" required className="w-full rounded-lg border-2 border-gray-200 px-4 py-3" />
              <textarea name="description" value={formData.description} onChange={onInput} placeholder="Description *" rows={4} required className="w-full rounded-lg border-2 border-gray-200 px-4 py-3" />
              <input name="seoKeywords" value={formData.seoKeywords} onChange={onInput} placeholder="SEO keywords" className="w-full rounded-lg border-2 border-gray-200 px-4 py-3" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select name="categoryId" value={formData.categoryId} onChange={onInput} required className="rounded-lg border-2 border-gray-200 px-4 py-3"><option value="">Category *</option>{categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}</select>
                <select name="country" value={formData.country} onChange={onInput} className="rounded-lg border-2 border-gray-200 px-4 py-3"><option value="">Country</option>{COUNTRY_OPTIONS.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}</select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input name="city" value={formData.city} onChange={onInput} placeholder="City *" required className="rounded-lg border-2 border-gray-200 px-4 py-3" />
                <input ref={addressInputRef} name="address" value={formData.address} onChange={onInput} placeholder="Address" className="rounded-lg border-2 border-gray-200 px-4 py-3" />
                <input name="postcode" value={formData.postcode} onChange={onInput} placeholder="Postcode" className="rounded-lg border-2 border-gray-200 px-4 py-3" />
              </div>
              {suggestions.length > 0 && <div className="rounded-lg border border-gray-200 p-2">{suggestions.map((s, i) => <button key={`${s.label}-${i}`} type="button" onClick={() => setFormData((p) => ({ ...p, address: s.label, city: s.city || p.city, postcode: s.postcode || p.postcode, country: s.country || p.country }))} className="block w-full text-left rounded-md px-3 py-2 text-sm hover:bg-gray-50">{s.label}</button>)}</div>}
              {geoError && provider !== "google" && <p className="text-sm text-amber-700">{geoError}</p>}
              {mapsError && <p className="text-sm text-amber-700">{mapsError}</p>}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="email" name="email" value={formData.email} onChange={onInput} placeholder="Contact email *" required className="rounded-lg border-2 border-gray-200 px-4 py-3" />
                <input name="phone" value={formData.phone} onChange={onInput} placeholder="Phone" className="rounded-lg border-2 border-gray-200 px-4 py-3" />
                <input name="website" value={formData.website} onChange={onInput} placeholder="Website" className="rounded-lg border-2 border-gray-200 px-4 py-3" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hasFeature("branding") && (
                  <div className="rounded-lg border-2 border-gray-200 p-3">
                    <p className="text-sm font-semibold mb-2">Logo upload</p>
                    <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload("logo", f); }} />
                    {formData.logo && <img src={formData.logo} alt="Logo" className="mt-3 h-20 w-20 rounded-md object-cover" />}
                  </div>
                )}
                {hasFeature("branding") && (
                  <div className="rounded-lg border-2 border-gray-200 p-3">
                    <p className="text-sm font-semibold mb-2">Cover upload</p>
                    <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload("coverImage", f); }} />
                    {formData.coverImage && <img src={formData.coverImage} alt="Cover" className="mt-3 h-20 w-full rounded-md object-cover" />}
                  </div>
                )}
              </div>

              {hasFeature("gallery") && (
                <div className="rounded-lg border-2 border-gray-200 p-3">
                  <p className="text-sm font-semibold mb-2">Gallery upload</p>
                  <input type="file" multiple accept="image/*" onChange={(e) => onUploadGallery(e.target.files)} />
                  {!!formData.gallery.length && <div className="mt-2 grid grid-cols-4 gap-2">{formData.gallery.map((url, idx) => <img key={`${url}-${idx}`} src={url} alt={`Gallery ${idx + 1}`} className="h-16 w-full rounded-md object-cover" />)}</div>}
                </div>
              )}

              {hasFeature("badges") && (
                <div className="rounded-lg border-2 border-gray-200 p-3">
                  <p className="text-sm font-semibold mb-2">Badges</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {badges.map((b) => {
                      const checked = formData.badgeIds.includes(b.id);
                      return (
                        <label key={b.id} className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${checked ? "border-emerald-500 bg-emerald-50" : "border-gray-200"}`}>
                          <input type="checkbox" checked={checked} onChange={(e) => setFormData((p) => ({ ...p, badgeIds: e.target.checked ? [...p.badgeIds, b.id] : p.badgeIds.filter((id) => id !== b.id) }))} />
                          <span>{b.icon}</span><span>{b.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {hasFeature("products") && (
                <div className="rounded-lg border-2 border-gray-200 p-3 space-y-3">
                  <div className="flex items-center justify-between"><p className="text-sm font-semibold">Products</p><button type="button" onClick={addProduct} className="rounded-md border border-emerald-300 px-2 py-1 text-xs font-semibold text-emerald-700">+ Add</button></div>
                  {formData.products.map((p, i) => (
                    <div key={`product-${i}`} className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <input value={p.name} onChange={(e) => setFormData((prev) => { const v = [...prev.products]; v[i] = { ...v[i], name: e.target.value }; return { ...prev, products: v }; })} placeholder="Name" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                      <input value={p.description} onChange={(e) => setFormData((prev) => { const v = [...prev.products]; v[i] = { ...v[i], description: e.target.value }; return { ...prev, products: v }; })} placeholder="Description" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                      <input type="number" step="0.01" value={p.price} onChange={(e) => setFormData((prev) => { const v = [...prev.products]; v[i] = { ...v[i], price: Number(e.target.value || 0) }; return { ...prev, products: v }; })} placeholder="Price" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                      <input type="url" value={p.purchaseLink} onChange={(e) => setFormData((prev) => { const v = [...prev.products]; v[i] = { ...v[i], purchaseLink: e.target.value }; return { ...prev, products: v }; })} placeholder="External purchase link (optional)" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                      <div className="md:col-span-2 rounded-lg border border-gray-200 p-3">
                        <p className="mb-2 text-xs font-semibold text-gray-700">Product image</p>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              onUploadProductImage(i, file);
                            }
                          }}
                          className="w-full text-sm"
                        />
                        {p.image && (
                          <img
                            src={p.image}
                            alt={`${p.name || "Product"} image`}
                            className="mt-2 h-20 w-28 rounded-md object-cover"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {hasFeature("menu_items") && (
                <div className="rounded-lg border-2 border-gray-200 p-3 space-y-3">
                  <div className="flex items-center justify-between"><p className="text-sm font-semibold">Menu Items</p><button type="button" onClick={addMenuItem} className="rounded-md border border-emerald-300 px-2 py-1 text-xs font-semibold text-emerald-700">+ Add</button></div>
                  {formData.menuItems.map((m, i) => (
                    <div key={`menu-${i}`} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <input value={m.category} onChange={(e) => setFormData((prev) => { const v = [...prev.menuItems]; v[i] = { ...v[i], category: e.target.value }; return { ...prev, menuItems: v }; })} placeholder="Category" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                      <input value={m.name} onChange={(e) => setFormData((prev) => { const v = [...prev.menuItems]; v[i] = { ...v[i], name: e.target.value }; return { ...prev, menuItems: v }; })} placeholder="Name" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                      <input value={m.description} onChange={(e) => setFormData((prev) => { const v = [...prev.menuItems]; v[i] = { ...v[i], description: e.target.value }; return { ...prev, menuItems: v }; })} placeholder="Description" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                      <input type="number" step="0.01" value={m.price} onChange={(e) => setFormData((prev) => { const v = [...prev.menuItems]; v[i] = { ...v[i], price: Number(e.target.value || 0) }; return { ...prev, menuItems: v }; })} placeholder="Price" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                    </div>
                  ))}
                </div>
              )}

              {hasFeature("services") && (
                <div className="rounded-lg border-2 border-gray-200 p-3 space-y-3">
                  <div className="flex items-center justify-between"><p className="text-sm font-semibold">Services</p><button type="button" onClick={addService} className="rounded-md border border-emerald-300 px-2 py-1 text-xs font-semibold text-emerald-700">+ Add</button></div>
                  {formData.services.map((s, i) => (
                    <div key={`service-${i}`} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input value={s.name} onChange={(e) => setFormData((prev) => { const v = [...prev.services]; v[i] = { ...v[i], name: e.target.value }; return { ...prev, services: v }; })} placeholder="Name" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                      <input value={s.description} onChange={(e) => setFormData((prev) => { const v = [...prev.services]; v[i] = { ...v[i], description: e.target.value }; return { ...prev, services: v }; })} placeholder="Description" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                      <input value={s.pricing} onChange={(e) => setFormData((prev) => { const v = [...prev.services]; v[i] = { ...v[i], pricing: e.target.value }; return { ...prev, services: v }; })} placeholder="Pricing" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-4">
                <button type="button" onClick={() => setStep(2)} className="flex-1 rounded-lg border-2 border-emerald-600 px-6 py-3 font-semibold text-emerald-600 hover:bg-emerald-50">Back</button>
                <button type="submit" disabled={submitting || uploading.logo || uploading.cover || uploading.gallery} className="flex-1 btn-primary disabled:opacity-50">{submitting ? "Submitting..." : (uploading.logo || uploading.cover || uploading.gallery) ? "Uploading..." : "Submit Listing"}</button>
              </div>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
