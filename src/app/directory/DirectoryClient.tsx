"use client";

import { useState } from "react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { BusinessCard, SearchBar } from "@/components/ui/Components";

interface DirectoryCategory {
  id: string;
  name: string;
  icon: string;
}

interface DirectoryBadge {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface DirectoryBusiness {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  coverImage: string;
  logo: string;
  featured: boolean;
  likes: number;
  categoryId: string;
  city: string;
  badgeIds: string[];
  category: DirectoryCategory;
  badges: DirectoryBadge[];
}

interface DirectoryClientProps {
  businesses: DirectoryBusiness[];
  categories: DirectoryCategory[];
  badges: DirectoryBadge[];
}

export default function DirectoryClient({
  businesses,
  categories,
  badges,
}: DirectoryClientProps) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [badgeFilter, setBadgeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBusinesses = businesses
    .filter((b) => categoryFilter === "all" || b.categoryId === categoryFilter)
    .filter((b) => badgeFilter === "all" || b.badgeIds.includes(badgeFilter))
    .filter(
      (b) =>
        searchQuery === "" ||
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.tagline.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-stone-50">
        <section className="bg-white border-b border-gray-200 py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="font-display text-4xl font-bold text-gray-900 mb-4">
              Sustainable Business Directory
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Discover {businesses.length} verified eco-conscious businesses
            </p>
            <div className="max-w-2xl">
              <SearchBar onSearch={setSearchQuery} />
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-20">
                <h3 className="font-display font-bold text-lg mb-4">Filters</h3>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    View
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setView("grid")}
                      className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                        view === "grid"
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Grid
                    </button>
                    <button
                      onClick={() => setView("list")}
                      className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                        view === "list"
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      List
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Certifications
                  </label>
                  <select
                    value={badgeFilter}
                    onChange={(e) => setBadgeFilter(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="all">All Certifications</option>
                    {badges.map((badge) => (
                      <option key={badge.id} value={badge.id}>
                        {badge.icon} {badge.name}
                      </option>
                    ))}
                  </select>
                </div>

                {(categoryFilter !== "all" ||
                  badgeFilter !== "all" ||
                  searchQuery) && (
                  <button
                    onClick={() => {
                      setCategoryFilter("all");
                      setBadgeFilter("all");
                      setSearchQuery("");
                    }}
                    className="w-full py-2 px-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </aside>

            <div className="flex-1">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-gray-600">
                  Showing {filteredBusinesses.length}{" "}
                  {filteredBusinesses.length === 1 ? "business" : "businesses"}
                </p>
              </div>

              {filteredBusinesses.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="font-display text-2xl font-bold text-gray-900 mb-2">
                    No businesses found
                  </h3>
                  <p className="text-gray-600">
                    Try adjusting your filters or search query
                  </p>
                </div>
              ) : (
                <div
                  className={
                    view === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 gap-6"
                      : "space-y-6"
                  }
                >
                  {filteredBusinesses.map((business) => (
                    <BusinessCard
                      key={business.id}
                      business={{
                        id: business.id,
                        slug: business.slug,
                        name: business.name,
                        tagline: business.tagline,
                        coverImage: business.coverImage,
                        logo: business.logo,
                        featured: business.featured,
                        likes: business.likes,
                        categoryId: business.categoryId,
                        badges: business.badgeIds,
                        location: {
                          city: business.city,
                          address: "",
                          postcode: "",
                        },
                      } as any}
                      category={business.category}
                      badges={business.badges}
                      averageRating={0}
                      reviewCount={0}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

