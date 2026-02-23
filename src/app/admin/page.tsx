"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { StatsCard } from "@/components/ui/Components";
import { businesses, categories, badges } from "@/data/mockData";

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    pendingApprovals: 0,
    categories: 0,
    badges: 0,
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

    setStats({
      totalBusinesses: businesses.length,
      pendingApprovals: businesses.filter((b) => b.status === "pending").length,
      categories: categories.length,
      badges: badges.length,
    });
  }, []);

  if (!isAuthenticated || user.role !== "admin") return null;

  const approvedCount = businesses.filter(
    (b) => b.status === "approved",
  ).length;
  const rejectedCount = businesses.filter(
    (b) => b.status === "rejected",
  ).length;

  return (
    <div className="flex min-h-screen bg-stone-50">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl">
          <div className="mb-8">
            <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 text-lg">
              Manage the directory and approve listings
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatsCard
              icon="🏢"
              label="Businesses"
              value={stats.totalBusinesses}
            />
            <StatsCard
              icon="⏳"
              label="Pending"
              value={stats.pendingApprovals}
            />
            <StatsCard icon="📂" label="Categories" value={stats.categories} />
            <StatsCard icon="🏷️" label="Badges" value={stats.badges} />
          </div>

          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="text-4xl font-bold text-emerald-600 mb-2">
                {approvedCount}
              </div>
              <p className="text-gray-600">Approved Businesses</p>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="text-4xl font-bold text-yellow-600 mb-2">
                {stats.pendingApprovals}
              </div>
              <p className="text-gray-600">Pending Approval</p>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="text-4xl font-bold text-red-600 mb-2">
                {rejectedCount}
              </div>
              <p className="text-gray-600">Rejected</p>
            </div>
          </div>

          {/* Management Sections */}
          <div className="bg-white rounded-2xl shadow-md p-8">
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">
              Management Areas
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <a
                href="/admin/businesses"
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-emerald-600 hover:bg-emerald-50 transition-all"
              >
                <div className="text-3xl mb-2">🏢</div>
                <h3 className="font-semibold text-gray-900 mb-1">Businesses</h3>
                <p className="text-sm text-gray-600">
                  Approve, reject, or edit business listings
                </p>
              </a>

              <a
                href="/admin/categories"
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-emerald-600 hover:bg-emerald-50 transition-all"
              >
                <div className="text-3xl mb-2">📂</div>
                <h3 className="font-semibold text-gray-900 mb-1">Categories</h3>
                <p className="text-sm text-gray-600">
                  Add, edit, or delete categories
                </p>
              </a>

              <a
                href="/admin/badges"
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-emerald-600 hover:bg-emerald-50 transition-all"
              >
                <div className="text-3xl mb-2">🏷️</div>
                <h3 className="font-semibold text-gray-900 mb-1">Badges</h3>
                <p className="text-sm text-gray-600">
                  Manage sustainability certifications
                </p>
              </a>

              <a
                href="/admin/content"
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-emerald-600 hover:bg-emerald-50 transition-all"
              >
                <div className="text-3xl mb-2">✏️</div>
                <h3 className="font-semibold text-gray-900 mb-1">Content</h3>
                <p className="text-sm text-gray-600">
                  Edit homepage and featured content
                </p>
              </a>

              <a
                href="/admin/users"
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-emerald-600 hover:bg-emerald-50 transition-all"
              >
                <div className="text-3xl mb-2">ðŸ‘¥</div>
                <h3 className="font-semibold text-gray-900 mb-1">Users</h3>
                <p className="text-sm text-gray-600">
                  View and manage user accounts
                </p>
              </a>

              <a
                href="/admin/posts"
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-emerald-600 hover:bg-emerald-50 transition-all"
              >
                <div className="text-3xl mb-2">ðŸ“</div>
                <h3 className="font-semibold text-gray-900 mb-1">Posts</h3>
                <p className="text-sm text-gray-600">
                  Manage news and blog posts
                </p>
              </a>

              <a
                href="/admin/payments"
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-emerald-600 hover:bg-emerald-50 transition-all"
              >
                <div className="text-3xl mb-2">ðŸ’³</div>
                <h3 className="font-semibold text-gray-900 mb-1">Payments</h3>
                <p className="text-sm text-gray-600">
                  Monitor subscriptions and one-time checkouts
                </p>
              </a>

              <a
                href="/admin/authors"
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-emerald-600 hover:bg-emerald-50 transition-all"
              >
                <div className="text-3xl mb-2">ðŸ–‹ï¸</div>
                <h3 className="font-semibold text-gray-900 mb-1">Authors</h3>
                <p className="text-sm text-gray-600">
                  Manage author profiles
                </p>
              </a>

              <a
                href="/admin/reviews"
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-emerald-600 hover:bg-emerald-50 transition-all"
              >
                <div className="text-3xl mb-2">â­</div>
                <h3 className="font-semibold text-gray-900 mb-1">Reviews</h3>
                <p className="text-sm text-gray-600">
                  Moderate business reviews
                </p>
              </a>

              <a
                href="/directory"
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-emerald-600 hover:bg-emerald-50 transition-all"
              >
                <div className="text-3xl mb-2">👁️</div>
                <h3 className="font-semibold text-gray-900 mb-1">Preview</h3>
                <p className="text-sm text-gray-600">
                  View the public directory
                </p>
              </a>

              <a
                href="/"
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-emerald-600 hover:bg-emerald-50 transition-all"
              >
                <div className="text-3xl mb-2">🏠</div>
                <h3 className="font-semibold text-gray-900 mb-1">Home</h3>
                <p className="text-sm text-gray-600">View the homepage</p>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
