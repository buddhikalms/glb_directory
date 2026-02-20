"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { createUserAction, deleteUserAction, updateUserAction } from "./actions";
import {
  emptyUserForm,
  type BusinessOption,
  type UserFormData,
  type UserRow,
} from "./types";

interface UsersClientProps {
  initialUsers: UserRow[];
  businesses: BusinessOption[];
}

export default function UsersClient({ initialUsers, businesses }: UsersClientProps) {
  const router = useRouter();
  const [allUsers, setAllUsers] = useState<UserRow[]>(initialUsers);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserFormData>(emptyUserForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRow["role"]>("all");
  const [businessFilter, setBusinessFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "email" | "role">("name");

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
  }, [isAuthenticated, router, user.role]);

  const businessMap = useMemo(() => {
    return new Map(businesses.map((business) => [business.id, business.name]));
  }, [businesses]);

  const visibleUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = allUsers.filter((item) => {
      const businessName = item.businessId
        ? businessMap.get(item.businessId) || item.businessName
        : "N/A";
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        (item.location || "").toLowerCase().includes(query) ||
        businessName.toLowerCase().includes(query);
      const matchesRole = roleFilter === "all" || item.role === roleFilter;
      const matchesBusiness =
        businessFilter === "all" || item.businessId === businessFilter;
      return matchesSearch && matchesRole && matchesBusiness;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "email") return a.email.localeCompare(b.email);
      if (sortBy === "role") return a.role.localeCompare(b.role);
      return a.name.localeCompare(b.name);
    });
  }, [
    allUsers,
    businessFilter,
    businessMap,
    roleFilter,
    searchQuery,
    sortBy,
  ]);

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyUserForm);
    setError(null);
    setShowForm(true);
  };

  const openEdit = (item: UserRow) => {
    setEditingId(item.id);
    setFormData({
      email: item.email,
      name: item.name,
      role: item.role,
      slug: item.slug,
      avatar: item.avatar,
      bio: item.bio,
      location: item.location,
      title: item.title,
      businessId: item.businessId,
    });
    setError(null);
    setShowForm(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      const saved = editingId
        ? await updateUserAction(editingId, formData)
        : await createUserAction(formData);

      setAllUsers((prev) => {
        if (editingId) {
          return prev.map((item) => (item.id === editingId ? saved : item));
        }
        return [saved, ...prev];
      });

      setShowForm(false);
      setEditingId(null);
      setFormData(emptyUserForm);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unexpected error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      setError(null);
      await deleteUserAction(id);
      setAllUsers((prev) => prev.filter((item) => item.id !== id));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Unexpected error",
      );
    }
  };

  if (!isAuthenticated || user.role !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-stone-50">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">
                Users
              </h1>
              <p className="text-gray-600">
                Manage users directly from the database.
              </p>
            </div>
            <button onClick={openCreate} className="btn-primary">
              + Add User
            </button>
          </div>
          <div className="mb-6 grid grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow-sm md:grid-cols-4">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, email, location, business"
              className="rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
            />
            <select
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value as "all" | UserRow["role"])
              }
              className="rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">All roles</option>
              <option value="admin">Admin</option>
              <option value="business_owner">Business Owner</option>
              <option value="author">Author</option>
              <option value="editor">Editor</option>
              <option value="subscriber">Subscriber</option>
              <option value="guest">Guest</option>
            </select>
            <select
              value={businessFilter}
              onChange={(e) => setBusinessFilter(e.target.value)}
              className="rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">All businesses</option>
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "name" | "email" | "role")
              }
              className="rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
            >
              <option value="name">Sort: Name A-Z</option>
              <option value="email">Sort: Email A-Z</option>
              <option value="role">Sort: Role</option>
            </select>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {showForm && (
            <div className="mb-8 rounded-2xl bg-white p-8 shadow-md">
              <h2 className="mb-6 font-display text-2xl font-bold text-gray-900">
                {editingId ? "Edit User" : "Add New User"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Role
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="admin">Admin</option>
                      <option value="business_owner">Business Owner</option>
                      <option value="author">Author</option>
                      <option value="editor">Editor</option>
                      <option value="subscriber">Subscriber</option>
                      <option value="guest">Guest</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Business
                    </label>
                    <select
                      name="businessId"
                      value={formData.businessId}
                      onChange={handleChange}
                      className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="">None</option>
                      {businesses.map((business) => (
                        <option key={business.id} value={business.id}>
                          {business.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Slug
                    </label>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Avatar URL
                    </label>
                    <input
                      type="text"
                      name="avatar"
                      value={formData.avatar}
                      onChange={handleChange}
                      className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={3}
                    className="w-full resize-none rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    placeholder="Optional"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Save Changes"
                        : "Create User"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-lg border-2 border-gray-200 px-4 py-2 text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl bg-white shadow-md">
            <div className="grid grid-cols-12 gap-4 border-b border-gray-100 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <div className="col-span-4">User</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-3">Business</div>
              <div className="col-span-2">Location</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {visibleUsers.map((item) => {
              const businessName = item.businessId
                ? businessMap.get(item.businessId) || item.businessName
                : "N/A";

              return (
                <div
                  key={item.id}
                  className="grid grid-cols-12 items-center gap-4 border-b border-gray-100 px-6 py-4 text-sm"
                >
                  <div className="col-span-4">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.email}</p>
                  </div>
                  <div className="col-span-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
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
                  <div className="col-span-3 text-gray-600">{businessName}</div>
                  <div className="col-span-2 text-gray-600">
                    {item.location || "N/A"}
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      onClick={() => openEdit(item)}
                      className="mr-3 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Quick Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}

            {visibleUsers.length === 0 && (
              <div className="p-10 text-center text-gray-600">No users available.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
