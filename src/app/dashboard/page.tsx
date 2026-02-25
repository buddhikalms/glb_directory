"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { StatsCard } from "@/components/ui/Components";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [business, setBusiness] = useState<any | null>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [businessLoading, setBusinessLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [selectedResponse, listResponse] = await Promise.all([
        fetch("/api/dashboard/owner-business"),
        fetch("/api/dashboard/owned-businesses"),
      ]);

      const selectedPayload = await selectedResponse.json().catch(() => ({}));
      const listPayload = await listResponse.json().catch(() => ({}));

      if (selectedResponse.ok) {
        setBusiness(selectedPayload.business || null);
      }
      if (listResponse.ok) {
        setBusinesses(
          Array.isArray(listPayload.businesses) ? listPayload.businesses : [],
        );
      }
    } finally {
      setBusinessLoading(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || user?.role !== "business_owner") {
      router.push("/login");
      return;
    }
    loadData();
  }, [isAuthenticated, loading, router, user?.role]);

  const handleDeleteListing = async (id: string) => {
    if (!confirm("Delete this listing? This action cannot be undone.")) return;
    try {
      setDeletingId(id);
      const response = await fetch(`/api/dashboard/owned-businesses/${id}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        alert(payload.error || "Failed to delete listing.");
        return;
      }
      await loadData();
    } finally {
      setDeletingId(null);
    }
  };

  if (loading || businessLoading) return null;
  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-stone-50">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl">
          <div className="bg-white rounded-2xl shadow-md p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold text-gray-900">
                Your Listings
              </h2>
              <a href="/submit" className="btn-primary">
                + Add New Listing
              </a>
            </div>

            {businesses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {businesses.map((item) => (
                  <div key={item.id} className="rounded-xl border-2 border-gray-200 p-4">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600 mb-2">{item.tagline}</p>
                    <span className="inline-block text-xs rounded bg-emerald-50 text-emerald-700 px-2 py-1 mb-3">
                      {item.status}
                    </span>
                    <div className="flex gap-3">
                      <a
                        href={`/dashboard/business?businessId=${item.id}`}
                        className="text-sm font-semibold text-emerald-700"
                      >
                        Manage
                      </a>
                      <a
                        href={item.slug ? `/business/${item.slug}` : "/directory"}
                        className="text-sm font-semibold text-gray-700"
                      >
                        View
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeleteListing(item.id)}
                        disabled={deletingId === item.id}
                        className="text-sm font-semibold text-red-600 disabled:opacity-50"
                      >
                        {deletingId === item.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">
                No listings yet. Add your first listing to get started.
              </p>
            )}
          </div>

          {business ? (
            <>
              <div className="mb-8">
                <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">
                  Welcome back, {user?.name}!
                </h1>
                <p className="text-gray-600 text-lg">
                  Manage your selected listing and content
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatsCard
                  icon="📊"
                  label="Views"
                  value={business.views ?? 0}
                />
                <StatsCard
                  icon="👥"
                  label="Clicks"
                  value={business.clicks ?? 0}
                />
                <StatsCard
                  icon="❤️"
                  label="Likes"
                  value={business.likes ?? 0}
                />
                <StatsCard icon="⭐" label="Rating" value={business.reviewCount > 0 ? Number(business.averageRating || 0).toFixed(1) : "New"} />
              </div>

              <div className="bg-white rounded-2xl shadow-md p-8 mb-8">
                <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">
                  Selected Listing Overview
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-display font-semibold text-lg text-gray-900 mb-4">
                      {business.name}
                    </h3>
                    <div className="space-y-3 text-gray-600">
                      <p>
                        <strong>Status:</strong>{" "}
                        <span className="capitalize text-emerald-600 font-semibold">
                          {business.status}
                        </span>
                      </p>
                      <p>
                        <strong>Location:</strong> {business.location?.city},{" "}
                        {business.location?.postcode}
                      </p>
                      <p>
                        <strong>Email:</strong> {business.contact?.email}
                      </p>
                      <p>
                        <strong>Phone:</strong> {business.contact?.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <Image
                      src={business.logo || "/uploads/businesses/logos/placeholder.png"}
                      alt={business.name}
                      width={160}
                      height={160}
                      className="w-40 h-40 rounded-xl object-cover shadow-md"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl shadow-md p-8">
              <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">
                No Listing Selected
              </h1>
              <p className="text-gray-600 mb-6">
                Add a new listing or choose one from the list above.
              </p>
              <a href="/submit" className="btn-primary">
                Create Your First Listing
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


