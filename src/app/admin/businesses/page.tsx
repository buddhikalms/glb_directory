"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { businesses } from "@/data/mockData";

export default function BusinessesPage() {
  const router = useRouter();
  const [allBusinesses, setAllBusinesses] = useState(businesses);
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
  }, []);

  const filteredBusinesses =
    filter === "all"
      ? allBusinesses
      : allBusinesses.filter((b) => b.status === filter);

  const handleApprove = (id: string) => {
    setAllBusinesses((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status: "approved" as const } : b,
      ),
    );
  };

  const handleReject = (id: string) => {
    setAllBusinesses((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status: "rejected" as const } : b,
      ),
    );
  };

  const handleDelete = (id: string) => {
    setAllBusinesses((prev) => prev.filter((b) => b.id !== id));
  };

  if (!isAuthenticated || user.role !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-stone-50">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl">
          <div className="mb-8">
            <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">
              Manage Businesses
            </h1>
            <p className="text-gray-600">
              Approve, reject, or delete business listings
            </p>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 mb-8">
            {(["all", "approved", "pending", "rejected"] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    filter === status
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-gray-700 border-2 border-gray-200 hover:border-emerald-600"
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

          {/* Businesses Table */}
          {filteredBusinesses.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Business
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Owner
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
                          <button
                            onClick={() =>
                              router.push(`/admin/businesses/${business.id}`)
                            }
                            className="hover:text-emerald-600 transition-colors text-left"
                          >
                            <p className="font-semibold text-gray-900 hover:underline">
                              {business.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              {business.location.city}
                            </p>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {business.ownerId}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded-full ${
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
                              onClick={() =>
                                router.push(`/admin/businesses/${business.id}`)
                              }
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-colors"
                            >
                              View Details
                            </button>
                            {business.status !== "approved" && (
                              <button
                                onClick={() => handleApprove(business.id)}
                                className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-semibold hover:bg-emerald-200 transition-colors"
                              >
                                Approve
                              </button>
                            )}
                            {business.status !== "rejected" && (
                              <button
                                onClick={() => handleReject(business.id)}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors"
                              >
                                Reject
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(business.id)}
                              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
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
            <div className="bg-white rounded-2xl p-12 text-center">
              <p className="text-gray-600 text-lg">
                No businesses found with this filter.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
