"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { businesses, users } from "@/data/mockData";
import type { User } from "@/data/mockData";

export default function UsersPage() {
  const router = useRouter();
  const [allUsers, setAllUsers] = useState(users);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<User>({
    id: "",
    email: "",
    name: "",
    role: "guest",
    slug: "",
    avatar: "",
    bio: "",
    location: "",
    title: "",
    businessId: "",
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
  }, []);

  const businessMap = useMemo(() => {
    return new Map(businesses.map((business) => [business.id, business.name]));
  }, []);

  const handleDelete = (id: string) => {
    setAllUsers((prev) => prev.filter((item) => item.id !== id));
  };

  const handleEdit = (item: User) => {
    setFormData({
      ...item,
      slug: item.slug || "",
      avatar: item.avatar || "",
      bio: item.bio || "",
      location: item.location || "",
      title: item.title || "",
      businessId: item.businessId || "",
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleNew = () => {
    setFormData({
      id: "",
      email: "",
      name: "",
      role: "guest",
      slug: "",
      avatar: "",
      bio: "",
      location: "",
      title: "",
      businessId: "",
    });
    setEditingId(null);
    setShowForm(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setAllUsers((prev) =>
        prev.map((item) => (item.id === editingId ? { ...formData } : item)),
      );
    } else {
      const newUser = { ...formData, id: `user-${Date.now()}` };
      setAllUsers((prev) => [newUser, ...prev]);
    }
    setShowForm(false);
    setEditingId(null);
  };

  if (!isAuthenticated || user.role !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-stone-50">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">
                Users
              </h1>
              <p className="text-gray-600">
                View and manage user accounts and roles
              </p>
            </div>
            <button onClick={handleNew} className="btn-primary">
              + Add User
            </button>
          </div>

          {showForm && (
            <div className="bg-white rounded-2xl p-8 shadow-md mb-8">
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">
                {editingId ? "Edit User" : "Add New User"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Role
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="admin">Admin</option>
                      <option value="business_owner">Business Owner</option>
                      <option value="guest">Guest</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Business ID
                    </label>
                    <input
                      type="text"
                      name="businessId"
                      value={formData.businessId || ""}
                      onChange={handleChange}
                      placeholder="Optional"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title || ""}
                      onChange={handleChange}
                      placeholder="e.g., Founder"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location || ""}
                      onChange={handleChange}
                      placeholder="Optional"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Slug
                    </label>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug || ""}
                      onChange={handleChange}
                      placeholder="Optional"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Avatar URL
                    </label>
                    <input
                      type="text"
                      name="avatar"
                      value={formData.avatar || ""}
                      onChange={handleChange}
                      placeholder="Optional"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio || ""}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none resize-none"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button type="submit" className="btn-primary">
                    {editingId ? "Save Changes" : "Create User"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border-2 border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div className="col-span-4">User</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-3">Business</div>
              <div className="col-span-2">Location</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {allUsers.map((item) => {
              const businessName = item.businessId
                ? businessMap.get(item.businessId)
                : "N/A";

              return (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 items-center text-sm"
                >
                  <div className="col-span-4">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.email}</p>
                  </div>
                  <div className="col-span-2">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                        item.role === "admin"
                          ? "bg-emerald-100 text-emerald-700"
                          : item.role === "business_owner"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {item.role.replace("_", " ")}
                    </span>
                  </div>
                  <div className="col-span-3 text-gray-600">
                    {businessName}
                  </div>
                  <div className="col-span-2 text-gray-600">
                    {item.location || "N/A"}
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-xs text-red-600 hover:text-red-700 font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}

            {allUsers.length === 0 && (
              <div className="p-10 text-center text-gray-600">
                No users available.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
