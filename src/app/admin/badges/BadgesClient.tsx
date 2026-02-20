"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { createBadgeAction, deleteBadgeAction, updateBadgeAction } from "./actions";
import { emptyBadgeForm, slugify, type BadgeFormData, type BadgeRow } from "./types";

interface BadgesClientProps {
  initialBadges: BadgeRow[];
}

const colorOptions = ["emerald", "green", "teal", "lime", "cyan"];

export default function BadgesClient({ initialBadges }: BadgesClientProps) {
  const router = useRouter();
  const [allBadges, setAllBadges] = useState<BadgeRow[]>(initialBadges);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BadgeFormData>(emptyBadgeForm);

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

  const canSubmit = useMemo(() => {
    return Boolean(formData.name && formData.slug && formData.icon && formData.color);
  }, [formData]);

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyBadgeForm);
    setShowForm(true);
  };

  const openEdit = (badge: BadgeRow) => {
    setEditingId(badge.id);
    setFormData({
      name: badge.name,
      slug: badge.slug,
      icon: badge.icon,
      color: badge.color,
    });
    setShowForm(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "name" && !editingId) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || saving) return;

    try {
      setSaving(true);
      setError(null);

      if (editingId) {
        const updated = await updateBadgeAction(editingId, formData);
        setAllBadges((prev) =>
          prev.map((badge) => (badge.id === editingId ? updated : badge)),
        );
      } else {
        const created = await createBadgeAction(formData);
        setAllBadges((prev) => [created, ...prev]);
      }

      setShowForm(false);
      setEditingId(null);
      setFormData(emptyBadgeForm);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unexpected error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this badge from all listings and remove it?")) return;

    try {
      setError(null);
      await deleteBadgeAction(id);
      setAllBadges((prev) => prev.filter((badge) => badge.id !== id));
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
              <h1 className="mb-2 font-display text-4xl font-bold text-gray-900">
                Manage Badges
              </h1>
              <p className="text-gray-600">
                Database-backed badges used by listings and directory filters.
              </p>
            </div>
            <button
              onClick={() => (showForm ? setShowForm(false) : openCreate())}
              className="btn-primary"
            >
              {showForm ? "Cancel" : "+ Add Badge"}
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {showForm && (
            <div className="mb-8 rounded-2xl bg-white p-8 shadow-md">
              <h2 className="mb-6 font-display text-2xl font-bold text-gray-900">
                {editingId ? "Edit Badge" : "Add New Badge"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Badge name"
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="badge-slug"
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input
                    type="text"
                    name="icon"
                    value={formData.icon}
                    onChange={handleChange}
                    placeholder="Emoji icon"
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                  <select
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  >
                    {colorOptions.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={!canSubmit || saving}
                    className="btn-primary disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Save Changes"
                        : "Create Badge"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setFormData(emptyBadgeForm);
                    }}
                    className="rounded-lg border-2 border-gray-200 px-4 py-2 text-gray-600 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </form>
            </div>
          )}

          {allBadges.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {allBadges.map((badge) => (
                <div key={badge.id} className="rounded-2xl bg-white p-6 shadow-md">
                  <div className="mb-3 text-5xl">{badge.icon}</div>
                  <h3 className="mb-1 font-display text-lg font-bold text-gray-900">
                    {badge.name}
                  </h3>
                  <p className="mb-3 text-xs text-gray-500">/{badge.slug}</p>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                      {badge.color}
                    </span>
                    <span className="rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                      Used by {badge.usageCount} listing
                      {badge.usageCount === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(badge)}
                      className="rounded-lg bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(badge.id)}
                      className="rounded-lg border-2 border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-12 text-center">
              <p className="text-lg text-gray-600">
                No badges found. Seed or create your first badge.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
