"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

type PostStatus = "draft" | "published";
type BlockStyle = "paragraph" | "h2" | "h3" | "quote" | "code";

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
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function toDateInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
  return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function computeReadTimeFromHtml(content: string) {
  const words = stripHtml(content).split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min`;
}

function markdownToHtml(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => {
      const t = line.trim();
      if (!t) return "<p><br/></p>";
      if (t.startsWith("### ")) return `<h3>${escapeHtml(t.slice(4))}</h3>`;
      if (t.startsWith("## ")) return `<h2>${escapeHtml(t.slice(3))}</h2>`;
      if (t.startsWith("# ")) return `<h1>${escapeHtml(t.slice(2))}</h1>`;
      if (t.startsWith("- ")) return `<ul><li>${escapeHtml(t.slice(2))}</li></ul>`;
      return `<p>${escapeHtml(t)}</p>`;
    })
    .join("");
}

function toEditorHtml(value: string) {
  const input = (value || "").trim();
  if (!input) return "";
  return /<[a-z][\s\S]*>/i.test(input) ? sanitizeHtml(input) : markdownToHtml(input);
}

export default function PostsPage() {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const [allPosts, setAllPosts] = useState<AdminPost[]>([]);
  const [authors, setAuthors] = useState<AuthorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingEditorImage, setUploadingEditorImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"content" | "seo">("content");
  const [slugTouched, setSlugTouched] = useState(false);
  const [formData, setFormData] = useState<AdminPost>(emptyPost);

  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};
  const isAuthenticated = typeof window !== "undefined" ? localStorage.getItem("isAuthenticated") === "true" : false;

  useEffect(() => {
    if (!isAuthenticated || user.role !== "admin") {
      router.push("/login");
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const [postsResponse, authorsResponse] = await Promise.all([fetch("/api/posts"), fetch("/api/authors")]);
        const postsPayload = await postsResponse.json();
        const authorsPayload = await authorsResponse.json();
        if (!postsResponse.ok) throw new Error(postsPayload?.error || "Failed to load posts.");
        if (!authorsResponse.ok) throw new Error(authorsPayload?.error || "Failed to load authors.");
        setAllPosts((Array.isArray(postsPayload) ? postsPayload : []).map((item: any) => ({
          id: item.id, title: item.title || "", slug: item.slug || "", category: item.category || "",
          authorSlug: item.authorSlug || "", excerpt: item.excerpt || "", content: toEditorHtml(item.content || ""),
          coverImage: item.coverImage || "", author: item.author || "", publishedAt: toDateInput(item.publishedAt),
          readTime: item.readTime || computeReadTimeFromHtml(item.content || ""),
          tags: Array.isArray(item.tags) ? item.tags.filter((tag: unknown): tag is string => typeof tag === "string") : [],
          featured: Boolean(item.featured), seoTitle: item.seoTitle || "", seoDescription: item.seoDescription || "",
          seoKeywords: item.seoKeywords || "", status: item.status === "draft" ? "draft" : "published", authorId: item.authorId || "",
        })));
        setAuthors((Array.isArray(authorsPayload) ? authorsPayload : []).map((item: any) => ({ id: item.id, name: item.name, slug: item.slug })));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unexpected error");
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated, router, user.role]);

  useEffect(() => {
    if (!showForm || !contentRef.current) return;
    contentRef.current.innerHTML = formData.content || "";
  }, [showForm, editingId, formData.content]);

  const wordCount = useMemo(() => stripHtml(formData.content).split(/\s+/).filter(Boolean).length, [formData.content]);
  const seoTitleValue = (formData.seoTitle || formData.title).trim();
  const seoDescriptionValue = (formData.seoDescription || formData.excerpt).trim();
  const seoKeywordsValue = (formData.seoKeywords || "").trim();
  const seoChecks = [seoTitleValue.length >= 40 && seoTitleValue.length <= 65, seoDescriptionValue.length >= 120 && seoDescriptionValue.length <= 160, formData.slug.trim().length > 0, seoKeywordsValue.length > 0];
  const seoScore = Math.round((seoChecks.filter(Boolean).length / seoChecks.length) * 100);

  const handleNew = () => { setFormData(emptyPost); setEditingId(null); setShowForm(true); setActiveTab("content"); setSlugTouched(false); setError(null); };
  const handleEdit = (post: AdminPost) => { setFormData({ ...post, content: toEditorHtml(post.content || "") }); setEditingId(post.id); setShowForm(true); setActiveTab("content"); setSlugTouched(true); setError(null); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value } as AdminPost;
      if (name === "title" && !slugTouched) next.slug = slugify(value);
      if (name === "slug") setSlugTouched(true);
      if (name === "authorId") {
        const selected = authors.find((item) => item.id === value);
        if (selected) { next.author = selected.name; next.authorSlug = selected.slug; }
      }
      return next;
    });
  };

  const handleTagsChange = (value: string) => setFormData((prev) => ({ ...prev, tags: value.split(",").map((tag) => tag.trim()).filter(Boolean) }));

  const syncEditorContent = () => {
    const editor = contentRef.current;
    if (!editor) return;
    const sanitized = sanitizeHtml(editor.innerHTML || "");
    if (sanitized !== editor.innerHTML) editor.innerHTML = sanitized;
    setFormData((prev) => ({ ...prev, content: sanitized, readTime: computeReadTimeFromHtml(sanitized) }));
  };

  const runEditorCommand = (command: string, value?: string) => {
    const editor = contentRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand(command, false, value);
    syncEditorContent();
  };

  const applyBlockStyle = (style: BlockStyle) => {
    if (style === "paragraph") return runEditorCommand("formatBlock", "p");
    if (style === "h2") return runEditorCommand("formatBlock", "h2");
    if (style === "h3") return runEditorCommand("formatBlock", "h3");
    if (style === "quote") return runEditorCommand("formatBlock", "blockquote");
    runEditorCommand("insertHTML", "<pre><code>Code snippet</code></pre><p><br/></p>");
  };

  const addLink = () => { const url = window.prompt("Enter URL"); if (url) runEditorCommand("createLink", url); };
  const addImageByUrl = () => { const url = window.prompt("Enter image URL"); if (url) runEditorCommand("insertImage", url.trim()); };
  const applyTemplate = (template: "intro" | "howto" | "cta" | "faq") => {
    const snippets = {
      intro: "<h2>Why this matters</h2><p>Add a short context section.</p>",
      howto: "<h2>How to start</h2><ol><li>Step 1</li><li>Step 2</li><li>Step 3</li></ol>",
      cta: "<h2>Next steps</h2><p>Invite readers to take one clear action.</p>",
      faq: "<h2>Frequently asked questions</h2><h3>Question</h3><p>Answer.</p>",
    } as const;
    runEditorCommand("insertHTML", snippets[template]);
  };

  const generateExcerpt = () => {
    if (formData.excerpt.trim()) return;
    setFormData((prev) => ({ ...prev, excerpt: stripHtml(prev.content).slice(0, 180) }));
  };

  const handleContentShortcuts = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!(e.metaKey || e.ctrlKey)) return;
    const key = e.key.toLowerCase();
    if (key === "b") { e.preventDefault(); runEditorCommand("bold"); }
    else if (key === "i") { e.preventDefault(); runEditorCommand("italic"); }
    else if (key === "u") { e.preventDefault(); runEditorCommand("underline"); }
    else if (key === "k") { e.preventDefault(); addLink(); }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    if (html) runEditorCommand("insertHTML", sanitizeHtml(html));
    else if (text) runEditorCommand("insertText", text);
  };

  const uploadEditorImage = async (file: File) => {
    const payload = new FormData();
    payload.append("kind", "gallery");
    payload.append("file", file);
    const response = await fetch("/api/uploads/business-image", { method: "POST", body: payload });
    const data = await response.json();
    if (!response.ok || !data?.url) throw new Error(data?.error || "Image upload failed.");
    return data.url as string;
  };

  const handleEditorImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingEditorImage(true);
      setError(null);
      const url = await uploadEditorImage(file);
      runEditorCommand("insertImage", url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploadingEditorImage(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.authorId) { setError("Please select an author profile."); return; }
    try {
      setSaving(true);
      setError(null);
      const sanitizedContent = sanitizeHtml(formData.content || "");
      const payload = {
        ...formData,
        id: editingId || crypto.randomUUID(),
        slug: slugify(formData.slug || formData.title),
        tags: formData.tags,
        content: sanitizedContent,
        readTime: computeReadTimeFromHtml(sanitizedContent),
        publishedAt: formData.publishedAt || new Date().toISOString().slice(0, 10),
        seoTitle: formData.seoTitle || null,
        seoDescription: formData.seoDescription || null,
        seoKeywords: formData.seoKeywords || null,
      };
      const response = await fetch(editingId ? `/api/posts/${editingId}` : "/api/posts", { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || "Failed to save post.");
      const mapped: AdminPost = {
        id: result.id, title: result.title || "", slug: result.slug || "", category: result.category || "", authorSlug: result.authorSlug || "",
        excerpt: result.excerpt || "", content: toEditorHtml(result.content || ""), coverImage: result.coverImage || "", author: result.author || "",
        publishedAt: toDateInput(result.publishedAt), readTime: result.readTime || "1 min",
        tags: Array.isArray(result.tags) ? result.tags.filter((tag: unknown): tag is string => typeof tag === "string") : [],
        featured: Boolean(result.featured), seoTitle: result.seoTitle || "", seoDescription: result.seoDescription || "", seoKeywords: result.seoKeywords || "",
        status: result.status === "draft" ? "draft" : "published", authorId: result.authorId || formData.authorId,
      };
      setAllPosts((prev) => (editingId ? prev.map((post) => (post.id === editingId ? mapped : post)) : [mapped, ...prev]));
      setShowForm(false);
      setEditingId(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error((await response.json())?.error || "Failed to delete post.");
      setAllPosts((prev) => prev.filter((post) => post.id !== id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unexpected error");
    }
  };

  const handleToggleFeatured = async (post: AdminPost) => {
    try {
      setError(null);
      const response = await fetch(`/api/posts/${post.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ featured: !post.featured }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || "Failed to update featured state.");
      setAllPosts((prev) => prev.map((item) => (item.id === post.id ? { ...item, featured: Boolean(result.featured) } : item)));
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Unexpected error");
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
              <h1 className="mb-2 font-display text-4xl font-bold text-gray-900">Blog Posts</h1>
              <p className="text-gray-600">Direct editor + live preview with Google Docs paste support.</p>
            </div>
            <button onClick={handleNew} className="btn-primary">+ Add Post</button>
          </div>

          {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {showForm && (
            <div className="mb-8 rounded-2xl bg-white p-8 shadow-md">
              <h2 className="mb-6 font-display text-2xl font-bold text-gray-900">{editingId ? "Edit Post" : "Create Post"}</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <input name="title" value={formData.title} onChange={handleChange} placeholder="Title" className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none" required />
                  <input name="slug" value={formData.slug} onChange={handleChange} placeholder="Slug" className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none" required />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <input name="category" value={formData.category} onChange={handleChange} placeholder="Category" className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none" required />
                  <select name="authorId" value={formData.authorId} onChange={handleChange} className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none" required>
                    <option value="">Select author profile</option>
                    {authors.map((author) => <option key={author.id} value={author.id}>{author.name}</option>)}
                  </select>
                  <input name="coverImage" value={formData.coverImage} onChange={handleChange} placeholder="Cover image URL" className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none" />
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <input type="date" name="publishedAt" value={formData.publishedAt} onChange={handleChange} className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none" />
                  <input name="readTime" value={formData.readTime} readOnly className="w-full rounded-lg border-2 border-gray-100 bg-gray-50 px-4 py-2 text-gray-600 focus:outline-none" />
                  <select name="status" value={formData.status} onChange={handleChange} className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                  <label className="flex items-center gap-2 rounded-lg border-2 border-gray-200 px-4 py-2 text-sm text-gray-700">
                    <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData((prev) => ({ ...prev, featured: e.target.checked }))} />
                    Featured
                  </label>
                </div>

                <textarea name="excerpt" value={formData.excerpt} onChange={handleChange} rows={2} placeholder="Excerpt" className="w-full resize-none rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none" />

                <div className="overflow-hidden rounded-2xl border-2 border-gray-200">
                  <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm">
                      <button type="button" onClick={() => setActiveTab("content")} className={`rounded-full px-3 py-1 ${activeTab === "content" ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>Editor</button>
                      <button type="button" onClick={() => setActiveTab("seo")} className={`rounded-full px-3 py-1 ${activeTab === "seo" ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>SEO</button>
                    </div>
                    <div className="text-xs text-gray-500">{wordCount} words</div>
                  </div>

                  {activeTab === "content" && (
                    <div className="space-y-4 p-4">
                      <div className="flex flex-wrap gap-2 text-xs">
                        <select onChange={(e) => applyBlockStyle(e.target.value as BlockStyle)} defaultValue="paragraph" className="rounded-lg border border-gray-200 px-2 py-1 text-gray-700">
                          <option value="paragraph">Paragraph</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option><option value="quote">Blockquote</option><option value="code">Code Block</option>
                        </select>
                        <button type="button" onClick={() => runEditorCommand("bold")} className="rounded-full border border-gray-200 px-3 py-1 text-gray-600 hover:bg-gray-50">Bold</button>
                        <button type="button" onClick={() => runEditorCommand("italic")} className="rounded-full border border-gray-200 px-3 py-1 text-gray-600 hover:bg-gray-50">Italic</button>
                        <button type="button" onClick={() => runEditorCommand("underline")} className="rounded-full border border-gray-200 px-3 py-1 text-gray-600 hover:bg-gray-50">Underline</button>
                        <button type="button" onClick={() => runEditorCommand("insertUnorderedList")} className="rounded-full border border-gray-200 px-3 py-1 text-gray-600 hover:bg-gray-50">UL</button>
                        <button type="button" onClick={() => runEditorCommand("insertOrderedList")} className="rounded-full border border-gray-200 px-3 py-1 text-gray-600 hover:bg-gray-50">OL</button>
                        <button type="button" onClick={addLink} className="rounded-full border border-gray-200 px-3 py-1 text-gray-600 hover:bg-gray-50">Link</button>
                        <button type="button" onClick={addImageByUrl} className="rounded-full border border-gray-200 px-3 py-1 text-gray-600 hover:bg-gray-50">Image URL</button>
                        <button type="button" onClick={() => imageInputRef.current?.click()} className="rounded-full border border-gray-200 px-3 py-1 text-gray-600 hover:bg-gray-50">{uploadingEditorImage ? "Uploading..." : "Upload Image"}</button>
                        <button type="button" onClick={() => runEditorCommand("insertHorizontalRule")} className="rounded-full border border-gray-200 px-3 py-1 text-gray-600 hover:bg-gray-50">Divider</button>
                        <button type="button" onClick={() => runEditorCommand("insertHTML", "<table><thead><tr><th>Column 1</th><th>Column 2</th></tr></thead><tbody><tr><td>Value 1</td><td>Value 2</td></tr></tbody></table><p><br/></p>")} className="rounded-full border border-gray-200 px-3 py-1 text-gray-600 hover:bg-gray-50">Table</button>
                        <button type="button" onClick={() => runEditorCommand("removeFormat")} className="rounded-full border border-amber-200 px-3 py-1 text-amber-700 hover:bg-amber-50">Clear</button>
                      </div>

                      <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleEditorImageChange} className="hidden" />

                      <div className="flex flex-wrap gap-2 text-xs">
                        <button type="button" onClick={() => applyTemplate("intro")} className="rounded-full border border-emerald-200 px-3 py-1 text-emerald-700 hover:bg-emerald-50">Template Intro</button>
                        <button type="button" onClick={() => applyTemplate("howto")} className="rounded-full border border-emerald-200 px-3 py-1 text-emerald-700 hover:bg-emerald-50">Template How-to</button>
                        <button type="button" onClick={() => applyTemplate("cta")} className="rounded-full border border-emerald-200 px-3 py-1 text-emerald-700 hover:bg-emerald-50">Template CTA</button>
                        <button type="button" onClick={() => applyTemplate("faq")} className="rounded-full border border-emerald-200 px-3 py-1 text-emerald-700 hover:bg-emerald-50">Template FAQ</button>
                        <button type="button" onClick={generateExcerpt} className="rounded-full border border-indigo-200 px-3 py-1 text-indigo-700 hover:bg-indigo-50">Auto Excerpt</button>
                        <span className="self-center text-gray-500">Paste from Google Docs. Shortcuts: Ctrl/Cmd+B, I, U, K.</span>
                      </div>

                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div ref={contentRef} contentEditable suppressContentEditableWarning onInput={syncEditorContent} onPaste={handlePaste} onKeyDown={handleContentShortcuts} className="min-h-[420px] overflow-auto rounded-lg border-2 border-gray-200 px-4 py-3 text-sm leading-7 focus:border-emerald-500 focus:outline-none" />
                        <div className="min-h-[420px] overflow-auto rounded-lg border-2 border-gray-200 p-4">
                          {stripHtml(formData.content) ? <article className="space-y-3 text-gray-700" dangerouslySetInnerHTML={{ __html: sanitizeHtml(formData.content) }} /> : <p className="text-sm text-gray-400">Live preview appears here.</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "seo" && (
                    <div className="space-y-4 p-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm font-semibold text-gray-700">SEO Title</label>
                          <input name="seoTitle" value={formData.seoTitle || ""} onChange={handleChange} className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none" />
                          <p className="mt-1 text-xs text-gray-500">{seoTitleValue.length} characters (target 40-65)</p>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-semibold text-gray-700">SEO Keywords</label>
                          <input name="seoKeywords" value={formData.seoKeywords || ""} onChange={handleChange} placeholder="comma separated" className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none" />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-700">SEO Description</label>
                        <textarea name="seoDescription" value={formData.seoDescription || ""} onChange={handleChange} rows={3} className="w-full resize-none rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none" />
                        <p className="mt-1 text-xs text-gray-500">{seoDescriptionValue.length} characters (target 120-160)</p>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <p className="mb-2 text-sm font-semibold text-gray-700">SEO Score: {seoScore}/100</p>
                        <ul className="space-y-1 text-xs text-gray-600">
                          <li>{seoChecks[0] ? "✓" : "•"} Title length is in range</li>
                          <li>{seoChecks[1] ? "✓" : "•"} Description length is in range</li>
                          <li>{seoChecks[2] ? "✓" : "•"} Slug is set</li>
                          <li>{seoChecks[3] ? "✓" : "•"} Keywords are provided</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                <input value={formData.tags.join(", ")} onChange={(e) => handleTagsChange(e.target.value)} placeholder="Tags (comma separated)" className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-emerald-500 focus:outline-none" />

                <div className="flex items-center gap-3">
                  <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">{saving ? "Saving..." : editingId ? "Save Changes" : "Create Post"}</button>
                  <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border-2 border-gray-200 px-4 py-2 text-gray-600 hover:bg-gray-50">Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl bg-white shadow-md">
            <div className="grid grid-cols-12 gap-4 border-b border-gray-100 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <div className="col-span-5">Title</div><div className="col-span-2">Category</div><div className="col-span-2">Author</div><div className="col-span-2">Published</div><div className="col-span-1 text-right">Actions</div>
            </div>
            {loading ? <div className="p-10 text-center text-gray-500">Loading posts...</div> : allPosts.length === 0 ? <div className="p-10 text-center text-gray-600">No posts available.</div> : allPosts.map((post) => (
              <div key={post.id} className="grid grid-cols-12 items-center gap-4 border-b border-gray-100 px-6 py-4 text-sm">
                <div className="col-span-5"><p className="font-semibold text-gray-900">{post.title}</p><p className="text-xs text-gray-500">/{post.slug}</p></div>
                <div className="col-span-2 text-gray-600">{post.category}</div>
                <div className="col-span-2 text-gray-600">{post.author}</div>
                <div className="col-span-2 text-gray-600">{post.publishedAt || "-"}</div>
                <div className="col-span-1 space-x-3 text-right">
                  <button onClick={() => handleEdit(post)} className="text-xs font-semibold text-blue-600 hover:text-blue-700">Edit</button>
                  <button onClick={() => handleToggleFeatured(post)} className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">{post.featured ? "Unfeature" : "Feature"}</button>
                  <button onClick={() => handleDelete(post.id)} className="text-xs font-semibold text-red-600 hover:text-red-700">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
