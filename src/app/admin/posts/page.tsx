"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Editor from "./Editor";

type PostStatus = "draft" | "published";

interface AuthorOption {
  id: string;
  name: string;
  slug: string;
}

interface AdminPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  authorSlug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  publishedAt: string;
  readTime: string;
  tags: string[];
  featured: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  status: PostStatus;
  authorId: string;
}

const emptyPost: AdminPost = {
  id: "",
  title: "",
  slug: "",
  category: "",
  authorSlug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  author: "",
  publishedAt: "",
  readTime: "1 min",
  tags: [],
  featured: false,
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  status: "draft",
  authorId: "",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toDateInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function sanitizeHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/(href|src)\s*=\s*"javascript:[^"]*"/gi, '$1="#"')
    .replace(/(href|src)\s*=\s*'javascript:[^']*'/gi, "$1='#'");
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function computeReadTime(content: string) {
  const words = stripHtml(content).split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min`;
}

async function parseJsonSafe(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as any;
  } catch {
    return { error: text };
  }
}

export default function PostsPage() {
  const router = useRouter();
  const [allPosts, setAllPosts] = useState<AdminPost[]>([]);
  const [authors, setAuthors] = useState<AuthorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"content" | "seo">("content");
  const [slugTouched, setSlugTouched] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PostStatus>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title">("newest");
  const [formData, setFormData] = useState<AdminPost>(emptyPost);

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
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [postsResponse, authorsResponse] = await Promise.all([
          fetch("/api/posts"),
          fetch("/api/authors"),
        ]);
        const postsPayload = await parseJsonSafe(postsResponse);
        const authorsPayload = await parseJsonSafe(authorsResponse);
        if (!postsResponse.ok)
          throw new Error(postsPayload?.error || "Failed to load posts.");
        if (!authorsResponse.ok)
          throw new Error(authorsPayload?.error || "Failed to load authors.");

        const nextPosts: AdminPost[] = (
          Array.isArray(postsPayload) ? postsPayload : []
        ).map((item: any) => ({
          id: item.id,
          title: item.title || "",
          slug: item.slug || "",
          category: item.category || "",
          authorSlug: item.authorSlug || "",
          excerpt: item.excerpt || "",
          content: sanitizeHtml(item.content || ""),
          coverImage: item.coverImage || "",
          author: item.author || "",
          publishedAt: toDateInput(item.publishedAt),
          readTime: item.readTime || computeReadTime(item.content || ""),
          tags: Array.isArray(item.tags)
            ? item.tags.filter(
                (tag: unknown): tag is string => typeof tag === "string",
              )
            : [],
          featured: Boolean(item.featured),
          seoTitle: item.seoTitle || "",
          seoDescription: item.seoDescription || "",
          seoKeywords: item.seoKeywords || "",
          status: item.status === "draft" ? "draft" : "published",
          authorId: item.authorId || "",
        }));

        const nextAuthors: AuthorOption[] = (
          Array.isArray(authorsPayload) ? authorsPayload : []
        ).map((item: any) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
        }));
        setAllPosts(nextPosts);
        setAuthors(nextAuthors);
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : "Unexpected error",
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated, router, user.role]);

  const wordCount = useMemo(
    () => stripHtml(formData.content).split(/\s+/).filter(Boolean).length,
    [formData.content],
  );
  const seoTitleValue = (formData.seoTitle || formData.title).trim();
  const seoDescriptionValue = (
    formData.seoDescription || formData.excerpt
  ).trim();
  const seoKeywordsValue = (formData.seoKeywords || "").trim();
  const seoChecks = [
    seoTitleValue.length >= 40 && seoTitleValue.length <= 65,
    seoDescriptionValue.length >= 120 && seoDescriptionValue.length <= 160,
    formData.slug.trim().length > 0,
    seoKeywordsValue.length > 0,
  ];
  const seoScore = Math.round(
    (seoChecks.filter(Boolean).length / seoChecks.length) * 100,
  );
  const categoriesInPosts = useMemo(() => {
    return Array.from(
      new Set(allPosts.map((item) => item.category).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));
  }, [allPosts]);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const visiblePosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = allPosts.filter((post) => {
      const matchesSearch =
        !query ||
        post.title.toLowerCase().includes(query) ||
        post.slug.toLowerCase().includes(query) ||
        post.author.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" || post.status === statusFilter;
      const matchesCategory =
        categoryFilter === "all" || post.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });
  }, [allPosts, categoryFilter, searchQuery, sortBy, statusFilter]);

  const handleNew = () => {
    setFormData(emptyPost);
    setEditingId(null);
    setShowForm(true);
    setActiveTab("content");
    setSlugTouched(false);
    setError(null);
  };

  const handleEdit = (post: AdminPost) => {
    setFormData(post);
    setEditingId(post.id);
    setShowForm(true);
    setActiveTab("content");
    setSlugTouched(true);
    setError(null);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value } as AdminPost;
      if (name === "title" && !slugTouched) next.slug = slugify(value);
      if (name === "slug") setSlugTouched(true);
      if (name === "authorId") {
        const selected = authors.find((item) => item.id === value);
        if (selected) {
          next.author = selected.name;
          next.authorSlug = selected.slug;
        }
      }
      return next;
    });
  };

  const handleTagsChange = (value: string) =>
    setFormData((prev) => ({
      ...prev,
      tags: value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.authorId) return setError("Please select an author profile.");
    try {
      setSaving(true);
      setError(null);
      const safeContent = sanitizeHtml(formData.content || "");
      const payload = {
        ...formData,
        id: editingId || crypto.randomUUID(),
        slug: slugify(formData.slug || formData.title),
        content: safeContent,
        readTime: computeReadTime(safeContent),
        tags: formData.tags,
        publishedAt:
          formData.publishedAt || new Date().toISOString().slice(0, 10),
        seoTitle: formData.seoTitle || null,
        seoDescription: formData.seoDescription || null,
        seoKeywords: formData.seoKeywords || null,
      };
      const response = await fetch(
        editingId ? `/api/posts/${editingId}` : "/api/posts",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = await parseJsonSafe(response);
      if (!response.ok)
        throw new Error(result?.error || "Failed to save post.");

      const mapped: AdminPost = {
        id: result.id,
        title: result.title || "",
        slug: result.slug || "",
        category: result.category || "",
        authorSlug: result.authorSlug || "",
        excerpt: result.excerpt || "",
        content: sanitizeHtml(result.content || ""),
        coverImage: result.coverImage || "",
        author: result.author || "",
        publishedAt: toDateInput(result.publishedAt),
        readTime: result.readTime || "1 min",
        tags: Array.isArray(result.tags)
          ? result.tags.filter(
              (tag: unknown): tag is string => typeof tag === "string",
            )
          : [],
        featured: Boolean(result.featured),
        seoTitle: result.seoTitle || "",
        seoDescription: result.seoDescription || "",
        seoKeywords: result.seoKeywords || "",
        status: result.status === "draft" ? "draft" : "published",
        authorId: result.authorId || formData.authorId,
      };
      setAllPosts((prev) =>
        editingId
          ? prev.map((post) => (post.id === editingId ? mapped : post))
          : [mapped, ...prev],
      );
      setShowForm(false);
      setEditingId(null);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unexpected error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (!response.ok)
        {
          const payload = await parseJsonSafe(response);
        throw new Error(
            payload?.error || "Failed to delete post.",
        );
        }
      setAllPosts((prev) => prev.filter((post) => post.id !== id));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Unexpected error",
      );
    }
  };

  const handleTogglePublish = async (post: AdminPost) => {
    try {
      setError(null);
      const nextStatus: PostStatus =
        post.status === "published" ? "draft" : "published";
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = await parseJsonSafe(response);
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to update status.");
      }
      setAllPosts((prev) =>
        prev.map((item) =>
          item.id === post.id
            ? {
                ...item,
                status: nextStatus,
              }
            : item,
        ),
      );
    } catch (toggleError) {
      setError(
        toggleError instanceof Error ? toggleError.message : "Unexpected error",
      );
    }
  };

  if (!isAuthenticated || user.role !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-stone-50">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-4xl font-bold text-gray-900">
            Blog Posts
          </h1>
          <button onClick={handleNew} className="btn-primary">
            + Add Post
          </button>
        </div>
        <div className="mb-8 grid grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow-sm md:grid-cols-4">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, slug, author"
            className="rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
          />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | PostStatus)
            }
            className="rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">All categories</option>
            {categoriesInPosts.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "newest" | "oldest" | "title")
            }
            className="rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="title">Sort: Title A-Z</option>
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
              {editingId ? "Edit Post" : "Create Post"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Title"
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2"
                  required
                />
                <input
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="Slug"
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <input
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="Category"
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2"
                  required
                />
                <select
                  name="authorId"
                  value={formData.authorId}
                  onChange={handleChange}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2"
                  required
                >
                  <option value="">Select author profile</option>
                  {authors.map((author) => (
                    <option key={author.id} value={author.id}>
                      {author.name}
                    </option>
                  ))}
                </select>
                <input
                  name="coverImage"
                  value={formData.coverImage}
                  onChange={handleChange}
                  placeholder="Cover image URL"
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2"
                />
              </div>
              <div className="grid grid-cols-4 gap-4">
                <input
                  type="date"
                  name="publishedAt"
                  value={formData.publishedAt}
                  onChange={handleChange}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2"
                />
                <input
                  name="readTime"
                  value={formData.readTime}
                  readOnly
                  className="w-full rounded-lg border-2 border-gray-100 bg-gray-50 px-4 py-2 text-gray-600"
                />
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
                <label className="flex items-center gap-2 rounded-lg border-2 border-gray-200 px-4 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        featured: e.target.checked,
                      }))
                    }
                  />
                  Featured
                </label>
              </div>

              <div className="overflow-hidden rounded-2xl border-2 border-gray-200">
                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => setActiveTab("content")}
                      className={`rounded-full px-3 py-1 ${activeTab === "content" ? "bg-emerald-600 text-white" : "text-gray-600"}`}
                    >
                      Editor
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("seo")}
                      className={`rounded-full px-3 py-1 ${activeTab === "seo" ? "bg-emerald-600 text-white" : "text-gray-600"}`}
                    >
                      SEO
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">{wordCount} words</div>
                </div>

                {activeTab === "content" && (
                  <div className="space-y-4 p-4">
                    <Editor
                      content={formData.content}
                      onChange={(content) => {
                        const safe = sanitizeHtml(content);
                        setFormData((prev) => ({
                          ...prev,
                          content: safe,
                          readTime: computeReadTime(safe),
                        }));
                      }}
                    />
                  </div>
                )}

                {activeTab === "seo" && (
                  <div className="space-y-4 p-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-semibold">
                          SEO Title
                        </label>
                        <input
                          name="seoTitle"
                          value={formData.seoTitle || ""}
                          onChange={handleChange}
                          className="w-full rounded-lg border-2 border-gray-200 px-4 py-2"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {seoTitleValue.length} chars (40-65)
                        </p>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-semibold">
                          SEO Keywords
                        </label>
                        <input
                          name="seoKeywords"
                          value={formData.seoKeywords || ""}
                          onChange={handleChange}
                          className="w-full rounded-lg border-2 border-gray-200 px-4 py-2"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold">
                        SEO Description
                      </label>
                      <textarea
                        name="seoDescription"
                        value={formData.seoDescription || ""}
                        onChange={handleChange}
                        rows={3}
                        className="w-full rounded-lg border-2 border-gray-200 px-4 py-2"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        {seoDescriptionValue.length} chars (120-160)
                      </p>
                    </div>
                    <div className="rounded-lg border bg-gray-50 p-4 text-sm">
                      SEO Score: {seoScore}/100
                    </div>
                  </div>
                )}
              </div>

              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                rows={2}
                placeholder="Excerpt"
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-2"
              />
              <input
                value={formData.tags.join(", ")}
                onChange={(e) => handleTagsChange(e.target.value)}
                placeholder="Tags (comma separated)"
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-2"
              />
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Create Post"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border-2 border-gray-200 px-4 py-2 text-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl bg-white shadow-md">
          <div className="grid grid-cols-12 gap-4 border-b px-6 py-4 text-xs font-semibold uppercase text-gray-500">
            <div className="col-span-4">Title</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Author</div>
            <div className="col-span-1">Date</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          {loading ? (
            <div className="p-10 text-center text-gray-500">
              Loading posts...
            </div>
          ) : visiblePosts.length === 0 ? (
            <div className="p-10 text-center text-gray-600">
              No posts available.
            </div>
          ) : (
            visiblePosts.map((post) => (
                <div
                  key={post.id}
                  className="grid grid-cols-12 items-center gap-4 border-b px-6 py-4 text-sm"
                >
                <div className="col-span-4">
                  <p className="font-semibold text-gray-900">{post.title}</p>
                  <p className="text-xs text-gray-500">/{post.slug}</p>
                </div>
                <div className="col-span-2 text-gray-600">{post.category}</div>
                <div className="col-span-2 text-gray-600">{post.author}</div>
                <div className="col-span-1 text-gray-600">
                  {post.publishedAt || "-"}
                </div>
                <div className="col-span-1">
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={post.status === "published"}
                      onChange={() => handleTogglePublish(post)}
                    />
                    <span
                      className={`text-xs font-semibold ${
                        post.status === "published"
                          ? "text-emerald-700"
                          : "text-gray-500"
                      }`}
                    >
                      {post.status === "published" ? "Published" : "Draft"}
                    </span>
                  </label>
                </div>
                <div className="col-span-2 text-right">
                  <button
                    onClick={() => handleEdit(post)}
                    className="mr-3 text-xs font-semibold text-blue-600"
                  >
                    Quick Edit
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-xs font-semibold text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
