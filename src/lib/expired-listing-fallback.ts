import { prisma } from "@/lib/prisma";
import { addBillingDuration } from "@/lib/pricing-duration";
import { getExpiredListingPackageId } from "@/lib/downgrade-policy-store";

type ListingPlanCandidate = {
  id: string;
  createdAt: Date;
  pricingPackageId: string | null;
  pricingPackage: {
    id: string;
    price: number;
    billingPeriod: "monthly" | "yearly";
    durationDays: number;
  } | null;
};

function isExpiredPaidPlan(candidate: ListingPlanCandidate, now: Date) {
  if (!candidate.pricingPackageId || !candidate.pricingPackage) return false;
  if (candidate.pricingPackage.price <= 0) return false;

  const expiresAt = addBillingDuration(
    candidate.createdAt,
    candidate.pricingPackage.billingPeriod,
    candidate.pricingPackage.durationDays,
  );
  return now.getTime() > expiresAt.getTime();
}

async function resolveFallbackPackageId() {
  const configuredId = await getExpiredListingPackageId();
  if (!configuredId) return null;

  const fallbackPackage = await prisma.pricingPackage.findUnique({
    where: { id: configuredId },
    select: { id: true, active: true },
  });
  if (!fallbackPackage?.active) return null;

  return fallbackPackage.id;
}

async function applyFallbackToCandidates(candidates: ListingPlanCandidate[]) {
  const fallbackPackageId = await resolveFallbackPackageId();
  if (!fallbackPackageId) return 0;

  const now = new Date();
  const expiredIds = candidates
    .filter((candidate) => candidate.pricingPackageId !== fallbackPackageId)
    .filter((candidate) => isExpiredPaidPlan(candidate, now))
    .map((candidate) => candidate.id);

  if (expiredIds.length === 0) return 0;

  const result = await prisma.business.updateMany({
    where: { id: { in: expiredIds } },
    data: {
      pricingPackageId: fallbackPackageId,
      featured: false,
    },
  });

  return result.count;
}

export async function applyExpiredListingFallbackForApprovedListings() {
  const candidates = await prisma.business.findMany({
    where: {
      status: "approved",
      pricingPackageId: { not: null },
    },
    select: {
      id: true,
      createdAt: true,
      pricingPackageId: true,
      pricingPackage: {
        select: {
          id: true,
          price: true,
          billingPeriod: true,
          durationDays: true,
        },
      },
    },
  });

  return applyFallbackToCandidates(candidates);
}

export async function applyExpiredListingFallbackForOwner(ownerId: string) {
  const candidates = await prisma.business.findMany({
    where: {
      ownerId,
      pricingPackageId: { not: null },
    },
    select: {
      id: true,
      createdAt: true,
      pricingPackageId: true,
      pricingPackage: {
        select: {
          id: true,
          price: true,
          billingPeriod: true,
          durationDays: true,
        },
      },
    },
  });

  return applyFallbackToCandidates(candidates);
}

export async function applyExpiredListingFallbackForOwnedBusiness(
  ownerId: string,
  businessId: string,
) {
  const candidate = await prisma.business.findFirst({
    where: {
      id: businessId,
      ownerId,
      pricingPackageId: { not: null },
    },
    select: {
      id: true,
      createdAt: true,
      pricingPackageId: true,
      pricingPackage: {
        select: {
          id: true,
          price: true,
          billingPeriod: true,
          durationDays: true,
        },
      },
    },
  });

  if (!candidate) return 0;
  return applyFallbackToCandidates([candidate]);
}

export async function applyExpiredListingFallbackForBusinessSlug(slug: string) {
  const candidate = await prisma.business.findFirst({
    where: {
      slug,
      status: "approved",
      pricingPackageId: { not: null },
    },
    select: {
      id: true,
      createdAt: true,
      pricingPackageId: true,
      pricingPackage: {
        select: {
          id: true,
          price: true,
          billingPeriod: true,
          durationDays: true,
        },
      },
    },
  });

  if (!candidate) return 0;
  return applyFallbackToCandidates([candidate]);
}
