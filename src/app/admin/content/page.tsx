"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function ContentPage() {
  const router = useRouter();
  const [content, setContent] = useState({
    heroTitle: "Discover Sustainable Businesses Near You",
    heroSubtitle:
      "Support local eco-conscious businesses making a positive impact on our planet",
    featuredTitle: "Featured Green Businesses",
    featuredSubtitle: "Discover businesses leading the way in sustainability",
  });
  const [saved, setSaved] = useState(false);

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setContent((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!isAuthenticated || user.role !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-stone-50">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-2xl">
          <div className="mb-8">
            <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">
              Content Management
            </h1>
            <p className="text-gray-600">Edit homepage and featured content</p>
          </div>

          {saved && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700">
              ✓ Content saved successfully!
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl p-8 shadow-md space-y-6"
          >
            <div className="border-b pb-6">
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
                Hero Section
              </h2>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hero Title
                </label>
                <input
                  type="text"
                  name="heroTitle"
                  value={content.heroTitle}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hero Subtitle
                </label>
                <textarea
                  name="heroSubtitle"
                  value={content.heroSubtitle}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
                Featured Section
              </h2>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Featured Title
                </label>
                <input
                  type="text"
                  name="featuredTitle"
                  value={content.featuredTitle}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Featured Subtitle
                </label>
                <textarea
                  name="featuredSubtitle"
                  value={content.featuredSubtitle}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            <button type="submit" className="w-full btn-primary">
              Save Content
            </button>
          </form>

          <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-200">
            <h3 className="font-display font-semibold text-blue-900 mb-3">
              Preview
            </h3>
            <div className="space-y-4 text-sm text-blue-800">
              <div>
                <strong>Hero Title:</strong> {content.heroTitle}
              </div>
              <div>
                <strong>Hero Subtitle:</strong> {content.heroSubtitle}
              </div>
              <div>
                <strong>Featured Title:</strong> {content.featuredTitle}
              </div>
              <div>
                <strong>Featured Subtitle:</strong> {content.featuredSubtitle}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
