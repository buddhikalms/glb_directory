import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { applyExpiredListingFallbackForApprovedListings } from "@/lib/expired-listing-fallback";
import { normalizePackageFeatures } from "@/lib/package-features";
import { prisma } from "@/lib/prisma";
import { addBillingDuration, type PricingBillingPeriod } from "@/lib/pricing-duration";
import { absoluteUrl, collectionPageSchema, createMetadata } from "@/lib/seo";
import DirectoryClient from "./DirectoryClient";

export const metadata: Metadata = createMetadata({
  title: "Business Directory",
  description:
    "Browse verified sustainable businesses by category, location, and sustainability badges.",
  pathname: "/directory",
});

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function calculatePackageExpiryDate(
  createdAt: Date,
  billingPeriod?: PricingBillingPeriod,
  durationDays?: number,
) {
  if (!billingPeriod) return "";
  const expiresAt = addBillingDuration(createdAt, billingPeriod, durationDays);

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(expiresAt);
}

export default async function DirectoryPage() {
  await applyExpiredListingFallbackForApprovedListings();

  const [businessesRaw, categories, badges] = await Promise.all([
    prisma.business.findMany({
      where: { status: "approved" },
      include: {
        category: { select: { id: true, name: true, icon: true } },
        pricingPackage: {
          select: {
            name: true,
            billingPeriod: true,
            durationDays: true,
            galleryLimit: true,
            features: true,
          },
        },
        badges: { include: { badge: true } },
        reviews: { select: { rating: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      select: { id: true, name: true, icon: true },
      orderBy: { name: "asc" },
    }),
    prisma.badge.findMany({
      select: { id: true, name: true, icon: true, color: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const businesses = businessesRaw.map((item) => {
    const location = toRecord(item.location);
    const enabledFeatures = new Set(
      normalizePackageFeatures(item.pricingPackage?.features),
    );
    const canUseBranding = enabledFeatures.has("branding");
    const canUseGallery = enabledFeatures.has("gallery");
    const canUseFeaturedListing = enabledFeatures.has("featured_listing");
    const gallery = toStringArray(item.gallery);
    const galleryLimit = item.pricingPackage?.galleryLimit;
    const visibleGallery = canUseGallery
      ? typeof galleryLimit === "number"
        ? gallery.slice(0, Math.max(galleryLimit, 0))
        : gallery
      : [];
    const reviewCount = item.reviews.length;
    const averageRating =
      reviewCount > 0
        ? item.reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviewCount
        : 0;

    return {
      id: item.id,
      slug: item.slug,
      name: item.name,
      tagline: item.tagline,
      coverImage: canUseBranding ? item.coverImage : "",
      gallery: visibleGallery,
      logo: canUseBranding ? item.logo : "",
      featured: canUseFeaturedListing ? item.featured : false,
      likes: item.likes,
      categoryId: item.categoryId,
      city: asString(location.city),
      badgeIds: item.badges.map((b) => b.badgeId),
      category: item.category,
      badges: item.badges.map((b) => b.badge),
      averageRating,
      reviewCount,
      pricingPackageName: item.pricingPackage?.name || "",
      packageExpiresAt: calculatePackageExpiryDate(
        item.createdAt,
        item.pricingPackage?.billingPeriod,
        item.pricingPackage?.durationDays,
      ),
    };
  });

  const directorySchema = collectionPageSchema({
    name: "Sustainable Business Directory",
    description:
      "A searchable directory of verified sustainable businesses and services.",
    pathname: "/directory",
    itemUrls: businesses.map((business) =>
      absoluteUrl(`/business/${business.slug}`),
    ),
  });

  return (
    <>
      <JsonLd id="directory-schema" data={directorySchema} />
      <DirectoryClient businesses={businesses} categories={categories} badges={badges} />
    </>
  );
}
