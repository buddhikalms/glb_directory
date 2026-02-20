"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { StatsCard } from "@/components/ui/Components";
import { getBusinessById } from "@/data/mockData";

export default function DashboardPage() {
  const router = useRouter();
  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : {};
  const isAuthenticated =
    typeof window !== "undefined"
      ? localStorage.getItem("isAuthenticated") === "true"
      : false;
  const business = user.businessId ? getBusinessById(user.businessId) : null;

  useEffect(() => {
    if (!isAuthenticated || user.role !== "business_owner") {
      router.push("/login");
    }
  }, []);

  if (!isAuthenticated || !business) return null;

  return (
    <div className="flex min-h-screen bg-stone-50">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl">
          <div className="mb-8">
            <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">
              Welcome back, {user.name}!
            </h1>
            <p className="text-gray-600 text-lg">
              Manage your business listing and content
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatsCard
              icon="📊"
              label="Views"
              value={Math.floor(Math.random() * 1000)}
            />
            <StatsCard
              icon="👥"
              label="Clicks"
              value={Math.floor(Math.random() * 500)}
            />
            <StatsCard
              icon="📞"
              label="Contacts"
              value={Math.floor(Math.random() * 100)}
            />
            <StatsCard icon="⭐" label="Rating" value="4.8" />
          </div>

          {/* Business Overview */}
          <div className="bg-white rounded-2xl shadow-md p-8 mb-8">
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">
              Business Overview
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
                    <strong>Location:</strong> {business.location.city},{" "}
                    {business.location.postcode}
                  </p>
                  <p>
                    <strong>Email:</strong> {business.contact.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {business.contact.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <Image
                  src={business.logo}
                  alt={business.name}
                  width={160}
                  height={160}
                  className="w-40 h-40 rounded-xl object-cover shadow-md"
                />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-md p-8">
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">
              Quick Actions
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <a
                href="/dashboard/business"
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-emerald-600 hover:bg-emerald-50 transition-all"
              >
                <div className="text-3xl mb-2">📝</div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Edit Business
                </h3>
                <p className="text-sm text-gray-600">
                  Update your business information
                </p>
              </a>

              <a
                href="/dashboard/products"
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-emerald-600 hover:bg-emerald-50 transition-all"
              >
                <div className="text-3xl mb-2">📦</div>
                <h3 className="font-semibold text-gray-900 mb-1">Products</h3>
                <p className="text-sm text-gray-600">
                  Manage your product listings
                </p>
              </a>

              <a
                href="/dashboard/menu"
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-emerald-600 hover:bg-emerald-50 transition-all"
              >
                <div className="text-3xl mb-2">🍽️</div>
                <h3 className="font-semibold text-gray-900 mb-1">Menu</h3>
                <p className="text-sm text-gray-600">
                  Create and manage your menu
                </p>
              </a>

              <a
                href="/dashboard/services"
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-emerald-600 hover:bg-emerald-50 transition-all"
              >
                <div className="text-3xl mb-2">🛠️</div>
                <h3 className="font-semibold text-gray-900 mb-1">Services</h3>
                <p className="text-sm text-gray-600">Manage your services</p>
              </a>

              <a
                href="/dashboard/media"
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-emerald-600 hover:bg-emerald-50 transition-all"
              >
                <div className="text-3xl mb-2">🖼️</div>
                <h3 className="font-semibold text-gray-900 mb-1">Media</h3>
                <p className="text-sm text-gray-600">Manage your images</p>
              </a>

              <a
                href="/business/green-leaf-cafe"
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-emerald-600 hover:bg-emerald-50 transition-all"
              >
                <div className="text-3xl mb-2">👁️</div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  View Profile
                </h3>
                <p className="text-sm text-gray-600">See your public listing</p>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
