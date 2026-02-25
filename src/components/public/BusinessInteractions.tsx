"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface Metrics {
  views: number;
  clicks: number;
  likes: number;
}

interface InteractionPayload {
  metrics?: Metrics;
  alreadyLiked?: boolean;
}

interface BusinessInteractionsProps {
  businessId: string;
  phone: string;
  email: string;
  website: string;
  ownerSlug: string;
  initialMetrics: Metrics;
}

export default function BusinessInteractions({
  businessId,
  phone,
  email,
  website,
  ownerSlug,
  initialMetrics,
}: BusinessInteractionsProps) {
  const [metrics, setMetrics] = useState<Metrics>(initialMetrics);
  const [liking, setLiking] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const sessionViewKey = useMemo(
    () => `business-view-tracked:${businessId}`,
    [businessId],
  );
  const likeCookieName = useMemo(() => `gd_like_${businessId}`, [businessId]);

  async function postInteraction(action: "view" | "click" | "like" | "unlike") {
    const response = await fetch(`/api/businesses/${businessId}/interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
      keepalive: true,
    });

    if (!response.ok) return null;
    const payload = (await response.json().catch(() => null)) as InteractionPayload | null;
    if (payload?.metrics) {
      setMetrics(payload.metrics);
    }
    return payload;
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(sessionViewKey)) return;
    window.sessionStorage.setItem(sessionViewKey, "1");
    void postInteraction("view");
  }, [sessionViewKey]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const key = `${likeCookieName}=`;
    const alreadyLiked = document.cookie
      .split(";")
      .map((item) => item.trim())
      .some((cookie) => cookie.startsWith(key));
    if (alreadyLiked) {
      setHasLiked(true);
    }
  }, [likeCookieName]);

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      const payload = await postInteraction(hasLiked ? "unlike" : "like");
      if (payload?.alreadyLiked === true) {
        setHasLiked(true);
      } else if (payload?.alreadyLiked === false) {
        setHasLiked(false);
      }
    } finally {
      setLiking(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-gray-700">
        {phone && (
          <a href={`tel:${phone}`} onClick={() => void postInteraction("click")}>
            Phone: {phone}
          </a>
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            onClick={() => void postInteraction("click")}
          >
            Email: {email}
          </a>
        )}
        {website && (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 hover:text-emerald-800"
            onClick={() => void postInteraction("click")}
          >
            Visit Website
          </a>
        )}
        {ownerSlug && (
          <Link
            href={`/owners/${ownerSlug}`}
            className="text-emerald-700 hover:text-emerald-800"
            onClick={() => void postInteraction("click")}
          >
            Meet the owner
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-full bg-stone-100 px-3 py-1 text-gray-700">
          {metrics.views} views
        </span>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-gray-700">
          {metrics.clicks} clicks
        </span>
        <button
          type="button"
          onClick={handleLike}
          disabled={liking}
          className="rounded-full bg-rose-100 px-3 py-1 font-semibold text-rose-700 disabled:opacity-60"
        >
          {liking
            ? hasLiked
              ? "Unliking..."
              : "Liking..."
            : hasLiked
              ? `Unlike (${metrics.likes})`
              : `Like (${metrics.likes})`}
        </button>
      </div>
    </div>
  );
}
