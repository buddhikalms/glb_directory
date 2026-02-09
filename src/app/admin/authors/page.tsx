"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { authors } from "@/data/mockData";
import type { AuthorProfile } from "@/data/mockData";

export default function AuthorsPage() {
  const router = useRouter();
  const [allAuthors, setAllAuthors] = useState(authors);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AuthorProfile>({
    id: "",
    name: "",
    slug: "",
    title: "",
    bio: "",
    avatar: "",
    location: "",
    links: {
      website: "",
      twitter: "",
      linkedin: "",
    },
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

  const handleDelete = (id: string) => {
    setAllAuthors((prev) => prev.filter((author) => author.id !== id));
  };

  const handleEdit = (author: AuthorProfile) => {
    setFormData({
      ...author,
      location: author.location || "",
      links: {
        website: author.links?.website || "",
        twitter: author.links?.twitter || "",
        linkedin: author.links?.linkedin || "",
      },
    });
    setEditingId(author.id);
    setShowForm(true);
  };

  const handleNew = () => {
    setFormData({
      id: "",
      name: "",
      slug: "",
      title: "",
      bio: "",
      avatar: "",
      location: "",
      links: {
        website: "",
        twitter: "",
        linkedin: "",
      },
    });
    setEditingId(null);
    setShowForm(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("links.")) {
      const key = name.split(".")[1] as keyof NonNullable<AuthorProfile["links"]>;
      setFormData((prev) => ({
        ...prev,
        links: { ...prev.links, [key]: value },
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setAllAuthors((prev) =>
        prev.map((author) => (author.id === editingId ? { ...formData } : author)),
      );
    } else {
      const newAuthor = { ...formData, id: `author-${Date.now()}` };
      setAllAuthors((prev) => [newAuthor, ...prev]);
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
                Authors
              </h1>
              <p className="text-gray-600">Manage author profiles and bios</p>
            </div>
            <button onClick={handleNew} className="btn-primary">
              + Add Author
            </button>
          </div>

          {showForm && (
            <div className="bg-white rounded-2xl p-8 shadow-md mb-8">
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">
                {editingId ? "Edit Author" : "Add New Author"}
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
                      Slug
                    </label>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                      required
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
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                      required
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
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Avatar URL
                    </label>
                    <input
                      type="text"
                      name="avatar"
                      value={formData.avatar}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="text"
                      name="links.website"
                      value={formData.links?.website || ""}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Twitter
                    </label>
                    <input
                      type="text"
                      name="links.twitter"
                      value={formData.links?.twitter || ""}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      LinkedIn
                    </label>
                    <input
                      type="text"
                      name="links.linkedin"
                      value={formData.links?.linkedin || ""}
                      onChange={handleChange}
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
                    value={formData.bio}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none resize-none"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button type="submit" className="btn-primary">
                    {editingId ? "Save Changes" : "Create Author"}
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
              <div className="col-span-4">Author</div>
              <div className="col-span-3">Title</div>
              <div className="col-span-2">Location</div>
              <div className="col-span-2">Slug</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {allAuthors.map((author) => (
              <div
                key={author.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 items-center text-sm"
              >
                <div className="col-span-4">
                  <p className="font-semibold text-gray-900">{author.name}</p>
                  <p className="text-xs text-gray-500">{author.bio}</p>
                </div>
                <div className="col-span-3 text-gray-600">{author.title}</div>
                <div className="col-span-2 text-gray-600">
                  {author.location || "N/A"}
                </div>
                <div className="col-span-2 text-gray-600">/{author.slug}</div>
                <div className="col-span-1 text-right">
                  <button
                    onClick={() => handleEdit(author)}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(author.id)}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            {allAuthors.length === 0 && (
              <div className="p-10 text-center text-gray-600">
                No authors available.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
