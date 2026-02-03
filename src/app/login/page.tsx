"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { users } from "@/data/mockData";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate login delay
    setTimeout(() => {
      const user = users.find((u) => u.email === email);

      if (user) {
        // Store session
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("isAuthenticated", "true");

        // Redirect based on role
        if (user.role === "admin") {
          router.push("/admin");
        } else if (user.role === "business_owner") {
          router.push("/dashboard");
        } else {
          router.push("/");
        }
      } else {
        setError(
          "Email not found. Please check your email or create an account.",
        );
        setLoading(false);
      }
    }, 500);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="inline-block text-5xl mb-4">🌿</div>
              <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600">Log in to access your dashboard</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Logging in..." : "Log In"}
              </button>
            </form>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-900 mb-3">
                Demo Accounts:
              </p>
              <div className="space-y-2 text-sm text-blue-800">
                <div>
                  <strong>Admin:</strong> admin@greenlivingblog.org.uk
                </div>
                <div>
                  <strong>Business Owner:</strong> owner@greenleafcafe.co.uk
                </div>
              </div>
            </div>

            <p className="text-center text-gray-600 mt-6">
              Don't have an account?{" "}
              <Link
                href="/submit"
                className="text-emerald-600 font-semibold hover:text-emerald-700"
              >
                List your business
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
