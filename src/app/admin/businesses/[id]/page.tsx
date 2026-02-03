"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { getBusinessById, getCategoryById } from "@/data/mockData";

export default function BusinessDetailPage() {
  const router = useRouter();
  const params = useParams();
  const businessId = params.id as string;
  const business = getBusinessById(businessId);
  const category = business ? getCategoryById(business.categoryId) : null;

  const [formData, setFormData] = useState(
    business
      ? {
          name: business.name,
          tagline: business.tagline,
          description: business.description,
          locationCity: business.location.city,
          locationAddress: business.location.address,
          locationPostcode: business.location.postcode,
          contactEmail: business.contact.email,
          contactPhone: business.contact.phone,
          contactWebsite: business.contact.website,
          featured: business.featured,
          status: business.status,
        }
      : null,
  );

  const [images, setImages] = useState([
    { id: "logo", name: "Logo", url: business?.logo, type: "logo" },
    {
      id: "cover",
      name: "Cover Image",
      url: business?.coverImage,
      type: "cover",
    },
  ]);

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

  if (!business || !formData) {
    return (
      <>
        <div className="flex min-h-screen bg-stone-50">
          <AdminSidebar />
          <main className="flex-1 p-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Business Not Found
              </h1>
              <Link href="/admin/businesses" className="btn-primary">
                Back to Businesses
              </Link>
            </div>
          </main>
        </div>
      </>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleImageUpload = (type: "logo" | "cover", file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      setImages((prev) =>
        prev.map((img) =>
          img.type === type
            ? { ...img, url: event.target?.result as string }
            : img,
        ),
      );
    };
    reader.readAsDataURL(file);
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
        <div className="max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link
                href="/admin/businesses"
                className="text-emerald-600 hover:text-emerald-700 font-semibold mb-2 block"
              >
                ← Back to Businesses
              </Link>
              <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">
                {business.name}
              </h1>
              <p className="text-gray-600">
                {category && `${category.icon} ${category.name}`}
              </p>
            </div>
            <div className="text-right">
              <div
                className={`text-sm font-semibold px-4 py-2 rounded-full inline-block ${
                  business.status === "approved"
                    ? "bg-emerald-100 text-emerald-700"
                    : business.status === "rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {business.status.charAt(0).toUpperCase() +
                  business.status.slice(1)}
              </div>
            </div>
          </div>

          {saved && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700">
              ✓ Changes saved successfully!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Images Section */}
            <div className="bg-white rounded-2xl p-8 shadow-md">
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">
                Images
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {images.map((img) => (
                  <div key={img.id}>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      {img.name}
                    </label>
                    <div className="relative mb-3 bg-gray-100 rounded-lg overflow-hidden h-48">
                      {img.url ? (
                        <img
                          src={img.url}
                          alt={img.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          No image
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        e.target.files?.[0] &&
                        handleImageUpload(img.type as any, e.target.files[0])
                      }
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Basic Information */}
            <div className="bg-white rounded-2xl p-8 shadow-md">
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">
                Basic Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tagline
                  </label>
                  <input
                    type="text"
                    name="tagline"
                    value={formData.tagline}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={5}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-2xl p-8 shadow-md">
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">
                Location
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    name="locationAddress"
                    value={formData.locationAddress}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="locationCity"
                      value={formData.locationCity}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Postcode
                    </label>
                    <input
                      type="text"
                      name="locationPostcode"
                      value={formData.locationPostcode}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-2xl p-8 shadow-md">
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">
                Contact Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    name="contactWebsite"
                    value={formData.contactWebsite}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-white rounded-2xl p-8 shadow-md">
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">
                Status & Settings
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Approval Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleChange}
                    className="w-4 h-4 mr-3"
                  />
                  <span className="text-sm font-semibold text-gray-700">
                    Featured Business
                  </span>
                </label>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-blue-50 rounded-2xl p-8 border border-blue-200">
              <h3 className="font-display font-semibold text-blue-900 mb-3">
                Business Information
              </h3>
              <div className="space-y-2 text-sm text-blue-800">
                <p>
                  <strong>Business ID:</strong> {business.id}
                </p>
                <p>
                  <strong>Slug:</strong> {business.slug}
                </p>
                <p>
                  <strong>Owner ID:</strong> {business.ownerId}
                </p>
                <p>
                  <strong>Views:</strong> {business.views}
                </p>
                <p>
                  <strong>Created:</strong> {business.createdAt}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button type="submit" className="flex-1 btn-primary">
                Save Changes
              </button>
              <Link
                href="/admin/businesses"
                className="flex-1 px-6 py-3 border-2 border-emerald-600 text-emerald-600 rounded-lg font-semibold hover:bg-emerald-50 transition-colors text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
