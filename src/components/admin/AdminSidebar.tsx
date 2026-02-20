"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="w-64 bg-sage-800 text-white min-h-screen p-6">
      <div className="mb-8">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xl">🌿</span>
          </div>
          <div className="font-display text-lg font-bold">Admin Panel</div>
        </Link>
      </div>

      <div className="mb-6 pb-6 border-b border-sage-600">
        <p className="text-sm text-sage-300 mb-1">Logged in as</p>
        <p className="font-semibold">{user?.name}</p>
      </div>

      <nav className="space-y-1">
        <Link
          href="/admin"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive("/admin")
              ? "bg-emerald-600 text-white font-semibold"
              : "text-sage-200 hover:bg-sage-700"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Dashboard
        </Link>

        <Link
          href="/admin/businesses"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive("/admin/businesses")
              ? "bg-emerald-600 text-white font-semibold"
              : "text-sage-200 hover:bg-sage-700"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          Businesses
        </Link>

        <Link
          href="/admin/categories"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive("/admin/categories")
              ? "bg-emerald-600 text-white font-semibold"
              : "text-sage-200 hover:bg-sage-700"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          Categories
        </Link>

        <Link
          href="/admin/badges"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive("/admin/badges")
              ? "bg-emerald-600 text-white font-semibold"
              : "text-sage-200 hover:bg-sage-700"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
          Badges
        </Link>

        <Link
          href="/admin/pricing"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive("/admin/pricing")
              ? "bg-emerald-600 text-white font-semibold"
              : "text-sage-200 hover:bg-sage-700"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Pricing
        </Link>

        <Link
          href="/admin/content"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive("/admin/content")
              ? "bg-emerald-600 text-white font-semibold"
              : "text-sage-200 hover:bg-sage-700"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Content
        </Link>

        <Link
          href="/admin/users"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive("/admin/users")
              ? "bg-emerald-600 text-white font-semibold"
              : "text-sage-200 hover:bg-sage-700"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-1a4 4 0 00-4-4h-1m-6 5H2v-1a4 4 0 014-4h5m1-5a4 4 0 11-8 0 4 4 0 018 0zm7 1a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Users
        </Link>

        <Link
          href="/admin/posts"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive("/admin/posts")
              ? "bg-emerald-600 text-white font-semibold"
              : "text-sage-200 hover:bg-sage-700"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7m14 0a2 2 0 00-2-2H7a2 2 0 00-2 2m14 0H5m4 4h6m-6 4h4"
            />
          </svg>
          Posts
        </Link>

        <Link
          href="/admin/authors"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive("/admin/authors")
              ? "bg-emerald-600 text-white font-semibold"
              : "text-sage-200 hover:bg-sage-700"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 7a4 4 0 110-8 4 4 0 010 8zm-7 14a7 7 0 0114 0H5z"
            />
          </svg>
          Authors
        </Link>

        <Link
          href="/admin/reviews"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive("/admin/reviews")
              ? "bg-emerald-600 text-white font-semibold"
              : "text-sage-200 hover:bg-sage-700"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 8h10M7 12h6m-9 8h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Reviews
        </Link>

        <Link
          href="/admin/settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive("/admin/settings")
              ? "bg-emerald-600 text-white font-semibold"
              : "text-sage-200 hover:bg-sage-700"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317a1 1 0 011.35-.936l1.784.713a1 1 0 001.073-.228l1.263-1.263a1 1 0 011.414 0l1.414 1.414a1 1 0 010 1.414l-1.263 1.263a1 1 0 00-.228 1.073l.713 1.784a1 1 0 01-.936 1.35h-1.786a1 1 0 00-.949.684l-.641 1.923a1 1 0 01-.949.684h-2a1 1 0 01-.949-.684l-.641-1.923a1 1 0 00-.949-.684H6.19a1 1 0 01-.936-1.35l.713-1.784a1 1 0 00-.228-1.073L4.476 6.26a1 1 0 010-1.414L5.89 3.432a1 1 0 011.414 0l1.263 1.263a1 1 0 001.073.228l1.784-.713z"
            />
          </svg>
          Settings
        </Link>
      </nav>

      <div className="mt-8 pt-6 border-t border-sage-600">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sage-200 hover:bg-sage-700 transition-all"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          View Public Site
        </Link>

        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sage-200 hover:bg-sage-700 transition-all w-full text-left"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}
