"use client";

import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";

type TemplateType =
  | "verification"
  | "welcome"
  | "admin_alert"
  | "listing_under_review"
  | "payment_received"
  | "listing_approved"
  | "listing_rejected";

type PreviewResponse = {
  ok: boolean;
  subject: string;
  text: string;
  html: string;
  error?: string;
};

const TEMPLATE_TYPES: TemplateType[] = [
  "verification",
  "welcome",
  "admin_alert",
  "listing_under_review",
  "payment_received",
  "listing_approved",
  "listing_rejected",
];

const TEMPLATE_LABELS: Record<TemplateType, string> = {
  verification: "Verification",
  welcome: "Welcome",
  admin_alert: "Admin Alert",
  listing_under_review: "Listing Under Review",
  payment_received: "Payment Received",
  listing_approved: "Listing Approved",
  listing_rejected: "Listing Rejected",
};

export default function AdminEmailTestPage() {
  const [to, setTo] = useState("");
  const [name, setName] = useState("Test User");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("guest");
  const [provider, setProvider] = useState("credentials");
  const [previews, setPreviews] = useState<Partial<Record<TemplateType, PreviewResponse>>>({});
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sendingTemplate, setSendingTemplate] = useState<TemplateType | null>(null);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      to: to || "test@example.com",
      name: name || "Test User",
      email: email || to || "test@example.com",
      role: role || "guest",
      provider: provider || "credentials",
    });
    return params.toString();
  }, [to, name, email, role, provider]);

  useEffect(() => {
    let active = true;
    setLoadingPreview(true);
    Promise.all(
      TEMPLATE_TYPES.map(async (type) => {
        const res = await fetch(`/api/admin/email-test?type=${type}&${queryString}`);
        const data = (await res.json()) as PreviewResponse;
        return [type, data] as const;
      }),
    )
      .then((entries) => {
        if (!active) return;
        const next: Partial<Record<TemplateType, PreviewResponse>> = {};
        for (const [type, data] of entries) {
          next[type] = data;
        }
        setPreviews(next);
      })
      .catch(() => {
        if (!active) return;
        setPreviews({});
      })
      .finally(() => {
        if (!active) return;
        setLoadingPreview(false);
      });

    return () => {
      active = false;
    };
  }, [queryString]);

  async function handleSend(templateType: TemplateType) {
    setMessage("");
    setError("");

    if (!to) {
      setError("Recipient email is required.");
      return;
    }

    setSendingTemplate(templateType);
    try {
      const res = await fetch("/api/admin/email-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: templateType,
          to,
          name,
          email: email || to,
          role,
          provider,
        }),
      });

      const data = (await res.json()) as { ok?: boolean; message?: string; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to send test email.");
      }

      setMessage(`${TEMPLATE_LABELS[templateType]}: ${data.message || "Test email sent."}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send test email.");
    } finally {
      setSendingTemplate(null);
    }
  }

  return (
    <div className="flex min-h-screen bg-stone-50">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-2">
          <section className="rounded-2xl bg-white p-6 shadow-md">
            <h1 className="font-display text-3xl font-bold text-gray-900">Email Template Test</h1>
            <p className="mt-2 text-sm text-gray-600">
              Preview and send test emails without registering an account.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Recipient Email</label>
                <input
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Email (for admin alert)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="new-user@example.com"
                    className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Role</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Provider</label>
                  <input
                    type="text"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {message ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>
              ) : null}
              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-md xl:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-gray-900">All Templates</h2>
              {loadingPreview ? <span className="text-xs text-gray-500">Loading...</span> : null}
            </div>
            <div className="space-y-5">
              {TEMPLATE_TYPES.map((type) => (
                <article key={type} className="rounded-xl border border-gray-200 p-3">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{TEMPLATE_LABELS[type]}</h3>
                      <p className="text-xs text-gray-500">Subject: {previews[type]?.subject || "-"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleSend(type)}
                      disabled={sendingTemplate !== null}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {sendingTemplate === type ? "Sending..." : "Send"}
                    </button>
                  </div>
                  <iframe
                    title={`${type}-preview`}
                    srcDoc={previews[type]?.html || "<p style='font-family:Arial'>Preview unavailable</p>"}
                    className="h-[540px] w-full rounded-lg border border-gray-200 bg-white"
                  />
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
