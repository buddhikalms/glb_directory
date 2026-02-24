"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { StatsCard } from "@/components/ui/Components";

type BusinessRow = {
  id: string;
  name: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [categoriesCount, setCategoriesCount] = useState(0);
  const [badgesCount, setBadgesCount] = useState(0);

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
      return;
    }

    let active = true;
    const load = async () => {
      try {
        const [businessesRes, categoriesRes, badgesRes] = await Promise.all([
          fetch("/api/businesses"),
          fetch("/api/categories"),
          fetch("/api/badges"),
        ]);

        if (!active) return;

        const businessesData = businessesRes.ok
          ? ((await businessesRes.json()) as BusinessRow[])
          : [];
        const categoriesData = categoriesRes.ok
          ? ((await categoriesRes.json()) as unknown[])
          : [];
        const badgesData = badgesRes.ok
          ? ((await badgesRes.json()) as unknown[])
          : [];

        setBusinesses(Array.isArray(businessesData) ? businessesData : []);
        setCategoriesCount(Array.isArray(categoriesData) ? categoriesData.length : 0);
        setBadgesCount(Array.isArray(badgesData) ? badgesData.length : 0);
      } catch {
        if (!active) return;
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [isAuthenticated, router, user.role]);

  const stats = useMemo(() => {
    const pending = businesses.filter((item) => item.status === "pending");
    const approved = businesses.filter((item) => item.status === "approved");
    const rejected = businesses.filter((item) => item.status === "rejected");
    return {
      totalBusinesses: businesses.length,
      pendingApprovals: pending.length,
      approvedCount: approved.length,
      rejectedCount: rejected.length,
      pendingListings: pending
        .slice()
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 6),
    };
  }, [businesses]);

  if (!isAuthenticated || user.role !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-stone-50">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl">
          <div className="mb-8">
            <h1 className="mb-2 font-display text-4xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-lg text-gray-600">
              Manage the directory and approve listings
            </p>
          </div>

          <section className="mb-8 rounded-2xl border border-emerald-100 bg-white p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-gray-900">
                Notifications
              </h2>
              <Link
                href="/admin/businesses"
                className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
              >
                View all listings
              </Link>
            </div>

            {stats.pendingApprovals > 0 ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                  {stats.pendingApprovals} listing
                  {stats.pendingApprovals === 1 ? "" : "s"} pending review.
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {stats.pendingListings.map((item) => (
                    <Link
                      key={item.id}
                      href="/admin/businesses"
                      className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm hover:border-emerald-300 hover:bg-emerald-50"
                    >
                      <div className="font-semibold text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-600">
                        Submitted {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                No pending listing notifications.
              </div>
            )}
          </section>

          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
            <StatsCard icon="🏢" label="Businesses" value={stats.totalBusinesses} />
            <StatsCard icon="⏳" label="Pending" value={stats.pendingApprovals} />
            <StatsCard icon="📂" label="Categories" value={categoriesCount} />
            <StatsCard icon="🏷️" label="Badges" value={badgesCount} />
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-md">
              <div className="mb-2 text-4xl font-bold text-emerald-600">
                {stats.approvedCount}
              </div>
              <p className="text-gray-600">Approved Businesses</p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-md">
              <div className="mb-2 text-4xl font-bold text-yellow-600">
                {stats.pendingApprovals}
              </div>
              <p className="text-gray-600">Pending Approval</p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-md">
              <div className="mb-2 text-4xl font-bold text-red-600">
                {stats.rejectedCount}
              </div>
              <p className="text-gray-600">Rejected</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

