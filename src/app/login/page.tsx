"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Footer from "@/components/public/Footer";
import Navbar from "@/components/public/Navbar";
import { useAuth } from "@/contexts/AuthContext";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const verifiedState = searchParams.get("verified");
  const { login, isAuthenticated, user, loading } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState("");
  const [message, setMessage] = useState(
    verifiedState === "success"
      ? "Email verified. You can sign in now."
      : verifiedState === "invalid"
        ? "Verification link is invalid or expired."
        : "",
  );
  const [loginData, setLoginData] = useState({ identifier: "", password: "" });
  const [signupData, setSignupData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading || !isAuthenticated) return;

    if (user?.role === "admin") {
      router.push("/admin");
      return;
    }
    if (user?.role === "business_owner") {
      router.push("/dashboard");
      return;
    }
    router.push(callbackUrl);
  }, [callbackUrl, isAuthenticated, loading, router, user?.role]);

  if (loading || isAuthenticated) return null;

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    const ok = await login(loginData.identifier, loginData.password);
    setSubmitting(false);

    if (!ok) {
      setError("Invalid credentials or email not verified.");
      return;
    }

    router.push(callbackUrl);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signupData),
    });
    const payload = await response.json().catch(() => ({}));
    setSubmitting(false);

    if (!response.ok) {
      setError(payload.error || "Registration failed.");
      return;
    }

    setMode("login");
    setMessage(
      "Account created. Check your email for a verification link before login.",
    );
    setSignupData({ name: "", username: "", email: "", password: "" });
  };

  const handleGoogle = async () => {
    setError("");
    setMessage("");
    await signIn("google", { callbackUrl });
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">
                {mode === "login" ? "Welcome Back" : "Create Account"}
              </h1>
              <p className="text-gray-600">
                {mode === "login"
                  ? "Sign in with email or Google"
                  : "Sign up with email and verify your account"}
              </p>
            </div>

            <div className="mb-6 flex rounded-lg border border-gray-200 p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 rounded-md py-2 text-sm font-semibold ${mode === "login" ? "bg-emerald-600 text-white" : "text-gray-600"}`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 rounded-md py-2 text-sm font-semibold ${mode === "signup" ? "bg-emerald-600 text-white" : "text-gray-600"}`}
              >
                Sign up
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {message && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                {message}
              </div>
            )}

            {mode === "login" ? (
              <form onSubmit={handleCredentialsLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email or Username
                  </label>
                  <input
                    type="text"
                    required
                    value={loginData.identifier}
                    onChange={(e) =>
                      setLoginData((prev) => ({
                        ...prev,
                        identifier: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn-primary disabled:opacity-50"
                >
                  {submitting ? "Signing in..." : "Sign in"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={signupData.name}
                    onChange={(e) =>
                      setSignupData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={signupData.username}
                    onChange={(e) =>
                      setSignupData((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                    placeholder="optional-public-handle"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={signupData.email}
                    onChange={(e) =>
                      setSignupData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    minLength={8}
                    required
                    value={signupData.password}
                    onChange={(e) =>
                      setSignupData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn-primary disabled:opacity-50"
                >
                  {submitting ? "Creating account..." : "Create account"}
                </button>
              </form>
            )}

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs uppercase tracking-wide text-gray-400">
                or
              </span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Continue with Google
            </button>

            <p className="mt-6 text-center text-sm text-gray-600">
              Need to list your business?{" "}
              <Link href="/submit" className="font-semibold text-emerald-700">
                Submit here
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
