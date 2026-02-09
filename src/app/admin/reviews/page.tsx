"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { businesses, reviews, users } from "@/data/mockData";

export default function ReviewsPage() {
  const router = useRouter();
  const [allReviews, setAllReviews] = useState(reviews);
  const [selectedBusinessId, setSelectedBusinessId] = useState("all");
  const [selectedOwnerId, setSelectedOwnerId] = useState("all");
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());

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

  const businessMap = useMemo(() => {
    return new Map(businesses.map((business) => [business.id, business.name]));
  }, []);

  const ownerMap = useMemo(() => {
    return new Map(
      users
        .filter((item) => item.role === "business_owner" && item.businessId)
        .map((item) => [item.businessId as string, item]),
    );
  }, []);

  const owners = useMemo(() => {
    return users.filter(
      (item) => item.role === "business_owner" && item.businessId,
    );
  }, []);

  const filteredReviews = allReviews.filter((review) => {
    if (selectedBusinessId !== "all" && review.businessId !== selectedBusinessId) {
      return false;
    }
    if (selectedOwnerId !== "all") {
      const owner = ownerMap.get(review.businessId);
      if (!owner || owner.id !== selectedOwnerId) return false;
    }
    if (showFlaggedOnly && !flaggedIds.has(review.id)) return false;
    return true;
  });

  const toggleFlag = (id: string) => {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDelete = (id: string) => {
    setAllReviews((prev) => prev.filter((review) => review.id !== id));
  };

  if (!isAuthenticated || user.role !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-stone-50">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl">
          <div className="mb-8">
            <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">
              Reviews
            </h1>
            <p className="text-gray-600">
              Moderate business reviews and ratings
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                    Listing
                  </label>
                  <select
                    value={selectedBusinessId}
                    onChange={(e) => setSelectedBusinessId(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="all">All listings</option>
                    {businesses.map((business) => (
                      <option key={business.id} value={business.id}>
                        {business.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                    Listing Owner
                  </label>
                  <select
                    value={selectedOwnerId}
                    onChange={(e) => setSelectedOwnerId(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="all">All owners</option>
                    {owners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={showFlaggedOnly}
                      onChange={(e) => setShowFlaggedOnly(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    Show flagged only
                  </label>
                </div>

                <div className="flex items-end justify-end text-sm text-gray-600">
                  {filteredReviews.length} review
                  {filteredReviews.length === 1 ? "" : "s"}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div className="col-span-3">Business</div>
              <div className="col-span-2">Author</div>
              <div className="col-span-1">Rating</div>
              <div className="col-span-4">Comment</div>
              <div className="col-span-1">Date</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {filteredReviews.map((review) => {
              const businessName = businessMap.get(review.businessId) || "Unknown";
              const owner = ownerMap.get(review.businessId);
              const isFlagged = flaggedIds.has(review.id);

              return (
              <div
                key={review.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 items-center text-sm"
              >
                <div className="col-span-3 text-gray-900 font-semibold">
                  {businessName}
                  {owner && (
                    <p className="text-xs text-gray-500 font-normal">
                      Owner: {owner.name}
                    </p>
                  )}
                </div>
                <div className="col-span-2 text-gray-600">
                  {review.authorName}
                </div>
                <div className="col-span-1 text-emerald-700 font-semibold">
                  {review.rating}.0
                  <div className="text-xs text-amber-500">
                    {"★".repeat(review.rating)}
                  </div>
                </div>
                <div className="col-span-4 text-gray-600 line-clamp-2">
                  {review.comment}
                  {isFlagged && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">
                      Flagged
                    </span>
                  )}
                </div>
                <div className="col-span-1 text-gray-600">
                  {review.createdAt}
                </div>
                <div className="col-span-1 text-right">
                  <button
                    onClick={() => toggleFlag(review.id)}
                    className="text-xs text-amber-600 hover:text-amber-700 font-semibold mr-3"
                  >
                    {isFlagged ? "Unflag" : "Flag"}
                  </button>
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
            })}

            {filteredReviews.length === 0 && (
              <div className="p-10 text-center text-gray-600">
                No reviews match the current filters.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
