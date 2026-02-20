"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { newsPosts } from "@/data/mockData";

export default function NewsPage() {
  const [featured, ...rest] = newsPosts;
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categories = useMemo(
    () => Array.from(new Set(newsPosts.map((post) => post.category))),
    [],
  );

  const filteredPosts = rest.filter((post) => {
    const matchesCategory =
      categoryFilter === "all" || post.category === categoryFilter;
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      query.length === 0 ||
      post.title.toLowerCase().includes(query) ||
      post.excerpt.toLowerCase().includes(query) ||
      post.tags.some((tag) => tag.toLowerCase().includes(query));
    return matchesCategory && matchesQuery;
  });

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-stone-50">
        <section className="bg-white border-b border-gray-200 py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-10 items-start">
              <div className="flex-1">
                <h1 className="font-display text-4xl font-bold text-gray-900 mb-4">
                  News & Updates
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl">
                  Stories, spotlights, and community progress from across the
                  directory.
                </p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 w-full lg:w-96">
                <p className="text-sm text-emerald-700 font-semibold mb-2">
                  Latest
                </p>
                <p className="text-gray-700">
                  Read the newest updates and discover sustainable businesses
                  making an impact.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-10">
              <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Search
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search articles, tags, or topics..."
                      className="w-full px-5 py-3 pr-12 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-gray-700"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      🔍
                    </span>
                  </div>
                </div>
                <div className="w-full lg:w-64">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {featured && (
              <Link
                href={`/news/${featured.slug}`}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white rounded-3xl overflow-hidden shadow-sm card-hover mb-12"
              >
                <div className="relative h-72 lg:h-full overflow-hidden">
                  <Image
                    src={featured.coverImage}
                    alt={featured.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-8">
                  <p className="text-sm text-emerald-600 font-semibold mb-2">
                    Featured • {featured.category}
                  </p>
                  <h2 className="font-display text-3xl font-bold text-gray-900 mb-4">
                    {featured.title}
                  </h2>
                  <p className="text-gray-600 text-lg mb-6">
                    {featured.excerpt}
                  </p>
                  <div className="text-sm text-gray-500">
                    {featured.publishedAt} • {featured.readTime} •{" "}
                    <span className="text-gray-600">By</span>{" "}
                    <Link
                      href={`/authors/${featured.authorSlug}`}
                      className="text-emerald-700 font-semibold"
                    >
                      {featured.author}
                    </Link>
                  </div>
                </div>
              </Link>
            )}

            {filteredPosts.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center">
                <p className="text-gray-600 text-lg">
                  No articles match your search.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/news/${post.slug}`}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm card-hover"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <p className="text-sm text-emerald-600 font-semibold mb-2">
                        {post.category}
                      </p>
                      <h2 className="font-display text-xl font-bold text-gray-900 mb-2">
                        {post.title}
                      </h2>
                      <p className="text-gray-600 mb-4">{post.excerpt}</p>
                      <p className="text-xs text-gray-500">
                        {post.publishedAt} • {post.readTime} • By{" "}
                        <Link
                          href={`/authors/${post.authorSlug}`}
                          className="text-emerald-700 font-semibold"
                        >
                          {post.author}
                        </Link>
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
