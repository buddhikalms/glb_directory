"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Footer from "@/components/public/Footer";
import Navbar from "@/components/public/Navbar";

const PENDING_LISTING_STORAGE_KEY = "submit.pendingListing";

type PendingListingPayload = {
  selectedPackage: string;
  paymentMode?: "subscription" | "one_time";
  [key: string]: unknown;
};

export default function SubmitSuccessPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [error, setError] = useState("");

  useEffect(() => {
    const finalize = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get("session_id");
        if (!sessionId) throw new Error("Missing Stripe session.");

        const raw = sessionStorage.getItem(PENDING_LISTING_STORAGE_KEY);
        if (!raw) throw new Error("No pending listing found.");

        const pendingPayload = JSON.parse(raw) as PendingListingPayload;
        if (!pendingPayload?.selectedPackage) {
          throw new Error("Missing selected package.");
        }

        const verifyRes = await fetch("/api/stripe/verify-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            selectedPackage: pendingPayload.selectedPackage,
            paymentMode: pendingPayload.paymentMode || "subscription",
          }),
        });
        const verifyPayload = await verifyRes.json().catch(() => ({}));
        if (!verifyRes.ok || !verifyPayload?.ok) {
          throw new Error(verifyPayload?.error || "Payment verification failed.");
        }

        const submitRes = await fetch("/api/submit-listing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...pendingPayload,
            stripeSessionId: sessionId,
          }),
        });
        const submitPayload = await submitRes.json().catch(() => ({}));
        if (!submitRes.ok) {
          throw new Error(submitPayload?.error || "Listing submission failed.");
        }

        sessionStorage.removeItem(PENDING_LISTING_STORAGE_KEY);
        setStatus("success");
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Payment finalization failed.");
      }
    };

    void finalize();
  }, []);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center bg-white rounded-2xl shadow-lg p-10">
          {status === "loading" && (
            <>
              <h1 className="font-display text-3xl font-bold text-gray-900 mb-4">
                Finalizing Submission
              </h1>
              <p className="text-gray-600">
                We are verifying your payment and creating your listing.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <h1 className="font-display text-3xl font-bold text-gray-900 mb-4">
                Listing Submitted
              </h1>
              <p className="text-gray-600 mb-8">
                Payment confirmed and your listing is now pending review.
              </p>
              <Link href="/dashboard" className="btn-primary">
                Go to Dashboard
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <h1 className="font-display text-3xl font-bold text-gray-900 mb-4">
                Submission Failed
              </h1>
              <p className="text-red-700 mb-8">{error}</p>
              <Link
                href="/submit"
                className="inline-flex rounded-lg border-2 border-emerald-600 px-6 py-3 font-semibold text-emerald-600 hover:bg-emerald-50"
              >
                Back to Submit
              </Link>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
