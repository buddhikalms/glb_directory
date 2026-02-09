"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { newsPosts } from "@/data/mockData";
import type { NewsPost } from "@/data/mockData";

type AdminPost = NewsPost & {
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  status?: "draft" | "published";
};

export default function PostsPage() {
  const router = useRouter();
  const [allPosts, setAllPosts] = useState<AdminPost[]>(newsPosts);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"content" | "seo">("content");
  const [formData, setFormData] = useState<AdminPost>({
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
    readTime: "",
    tags: [],
    featured: false,
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    status: "draft",
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

  const handleToggleFeatured = (id: string) => {
    setAllPosts((prev) =>
      prev.map((post) =>
        post.id === id ? { ...post, featured: !post.featured } : post,
      ),
    );
  };

  const handleEdit = (post: AdminPost) => {
    setFormData({
      ...post,
      seoTitle: post.seoTitle || "",
      seoDescription: post.seoDescription || "",
      seoKeywords: post.seoKeywords || "",
      status: post.status || "published",
    });
    setEditingId(post.id);
    setShowForm(true);
  };

  const handleNew = () => {
    setFormData({
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
      readTime: "",
      tags: [],
      featured: false,
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
      status: "draft",
    });
    setEditingId(null);
    setShowForm(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    setFormData((prev) => ({ ...prev, tags }));
  };

  const wordCount = useMemo(() => {
    const words = formData.content.trim().split(/\s+/).filter(Boolean);
    return words.length;
  }, [formData.content]);

  const insertAtCursor = (snippet: string) => {
    setFormData((prev) => ({ ...prev, content: `${prev.content}${snippet}` }));
  };

  const applyWrap = (before: string, after: string) => {
    setFormData((prev) => ({ ...prev, content: `${prev.content}${before}${after}` }));
  };

  const renderPreview = (value: string) => {
    return value
      .split("\n")
      .map((line, index) => {
        if (line.startsWith("### ")) {
          return (
            <h3 key={index} className="text-lg font-semibold text-gray-900 mt-4">
              {line.replace("### ", "")}
            </h3>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h2 key={index} className="text-xl font-semibold text-gray-900 mt-5">
              {line.replace("## ", "")}
            </h2>
          );
        }
        if (line.startsWith("# ")) {
          return (
            <h1 key={index} className="text-2xl font-bold text-gray-900 mt-6">
              {line.replace("# ", "")}
            </h1>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <ul key={index} className="list-disc ml-6">
              <li>{line.replace("- ", "")}</li>
            </ul>
          );
        }
        return (
          <p key={index} className="text-gray-700 leading-7">
            {line}
          </p>
        );
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setAllPosts((prev) =>
        prev.map((post) => (post.id === editingId ? { ...formData } : post)),
      );
    } else {
      const newPost = { ...formData, id: `post-${Date.now()}` };
      setAllPosts((prev) => [newPost, ...prev]);
    }
    setShowForm(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setAllPosts((prev) => prev.filter((post) => post.id !== id));
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
                Posts
              </h1>
              <p className="text-gray-600">
                Manage news posts, featured content, and SEO metadata
              </p>
            </div>
            <button onClick={handleNew} className="btn-primary">
              + Add Post
            </button>
          </div>

          {showForm && (
            <div className="bg-white rounded-2xl p-8 shadow-md mb-8">
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">
                {editingId ? "Edit Post" : "Add New Post"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                      Category
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Author Name
                    </label>
                    <input
                      type="text"
                      name="author"
                      value={formData.author}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Author Slug
                    </label>
                    <input
                      type="text"
                      name="authorSlug"
                      value={formData.authorSlug}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cover Image URL
                    </label>
                    <input
                      type="text"
                      name="coverImage"
                      value={formData.coverImage}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Published Date
                    </label>
                    <input
                      type="date"
                      name="publishedAt"
                      value={formData.publishedAt}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Read Time
                    </label>
                    <input
                      type="text"
                      name="readTime"
                      value={formData.readTime}
                      onChange={handleChange}
                      placeholder="e.g., 5 min"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Excerpt
                  </label>
                  <textarea
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none resize-none"
                  />
                </div>

                <div className="border-2 border-gray-200 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center gap-3 text-sm">
                      <button
                        type="button"
                        onClick={() => setActiveTab("content")}
                        className={`px-3 py-1 rounded-full ${
                          activeTab === "content"
                            ? "bg-emerald-600 text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        Editor
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("seo")}
                        className={`px-3 py-1 rounded-full ${
                          activeTab === "seo"
                            ? "bg-emerald-600 text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        SEO
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      {wordCount} words
                    </div>
                  </div>

                  {activeTab === "content" && (
                    <div className="p-4 space-y-4">
                      <div className="flex flex-wrap gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => applyWrap("**", "**")}
                          className="px-3 py-1 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50"
                        >
                          Bold
                        </button>
                        <button
                          type="button"
                          onClick={() => applyWrap("_", "_")}
                          className="px-3 py-1 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50"
                        >
                          Italic
                        </button>
                        <button
                          type="button"
                          onClick={() => insertAtCursor("\n# Heading 1\n")}
                          className="px-3 py-1 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50"
                        >
                          H1
                        </button>
                        <button
                          type="button"
                          onClick={() => insertAtCursor("\n## Heading 2\n")}
                          className="px-3 py-1 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50"
                        >
                          H2
                        </button>
                        <button
                          type="button"
                          onClick={() => insertAtCursor("\n### Heading 3\n")}
                          className="px-3 py-1 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50"
                        >
                          H3
                        </button>
                        <button
                          type="button"
                          onClick={() => insertAtCursor("\n- List item\n")}
                          className="px-3 py-1 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50"
                        >
                          List
                        </button>
                        <button
                          type="button"
                          onClick={() => insertAtCursor("\n[Link Text](https://)\n")}
                          className="px-3 py-1 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50"
                        >
                          Link
                        </button>
                        <button
                          type="button"
                          onClick={() => insertAtCursor("\n> Quote\n")}
                          className="px-3 py-1 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50"
                        >
                          Quote
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Content (Markdown)
                          </label>
                          <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            rows={14}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none resize-none font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Live Preview
                          </label>
                          <div className="h-full min-h-[340px] border-2 border-gray-200 rounded-lg p-4 overflow-auto bg-white">
                            {formData.content.trim().length > 0 ? (
                              <div className="space-y-3">
                                {renderPreview(formData.content)}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400">
                                Preview will appear here.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "seo" && (
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            SEO Title
                          </label>
                          <input
                            type="text"
                            name="seoTitle"
                            value={formData.seoTitle || ""}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            SEO Keywords
                          </label>
                          <input
                            type="text"
                            name="seoKeywords"
                            value={formData.seoKeywords || ""}
                            onChange={handleChange}
                            placeholder="comma separated"
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          SEO Description
                        </label>
                        <textarea
                          name="seoDescription"
                          value={formData.seoDescription || ""}
                          onChange={handleChange}
                          rows={3}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={formData.tags.join(", ")}
                    onChange={handleTagsChange}
                    placeholder="comma separated"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button type="submit" className="btn-primary">
                    {editingId ? "Save Changes" : "Create Post"}
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
              <div className="col-span-5">Title</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Author</div>
              <div className="col-span-2">Published</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {allPosts.map((post) => (
              <div
                key={post.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 items-center text-sm"
              >
                <div className="col-span-5">
                  <p className="font-semibold text-gray-900">{post.title}</p>
                  <p className="text-xs text-gray-500">/{post.slug}</p>
                </div>
                <div className="col-span-2 text-gray-600">{post.category}</div>
                <div className="col-span-2 text-gray-600">{post.author}</div>
                <div className="col-span-2 text-gray-600">
                  {post.publishedAt}
                </div>
                <div className="col-span-1 text-right space-x-3">
                  <button
                    onClick={() => handleEdit(post)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleFeatured(post.id)}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
                  >
                    {post.featured ? "Unfeature" : "Feature"}
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {allPosts.length === 0 && (
              <div className="p-10 text-center text-gray-600">
                No posts available.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
