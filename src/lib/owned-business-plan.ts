import {
  getPackageFeatureLabel,
  normalizePackageFeatures,
  type PackageFeatureKey,
} from "@/lib/package-features";
import { prisma } from "@/lib/prisma";
import { applyExpiredListingFallbackForOwnedBusiness } from "@/lib/expired-listing-fallback";

export type OwnedBusinessPlanContext = {
  businessId: string;
  hasActivePackage: boolean;
  enabledFeatures: Set<PackageFeatureKey>;
  galleryLimit: number;
};

export async function getOwnedBusinessPlanContext(
  ownerId: string,
  businessId: string,
): Promise<OwnedBusinessPlanContext | null> {
  await applyExpiredListingFallbackForOwnedBusiness(ownerId, businessId);

  const business = await prisma.business.findFirst({
    where: { id: businessId, ownerId },
    select: {
      id: true,
      pricingPackage: {
        select: {
          id: true,
          active: true,
          features: true,
          galleryLimit: true,
        },
      },
    },
  });

  if (!business) return null;

  const hasActivePackage = Boolean(
    business.pricingPackage?.id && business.pricingPackage.active,
  );
  const enabledFeatures = hasActivePackage
    ? new Set<PackageFeatureKey>(
        normalizePackageFeatures(business.pricingPackage?.features),
      )
    : new Set<PackageFeatureKey>();

  return {
    businessId: business.id,
    hasActivePackage,
    enabledFeatures,
    galleryLimit:
      hasActivePackage && business.pricingPackage
        ? Math.max(business.pricingPackage.galleryLimit, 0)
        : 0,
  };
}

export function getPlanFeatureAccessError(
  context: OwnedBusinessPlanContext,
  feature: PackageFeatureKey,
): string | null {
  if (!context.hasActivePackage) {
    return "An active pricing plan is required to use this feature.";
  }

  if (!context.enabledFeatures.has(feature)) {
    const featureLabel = getPackageFeatureLabel(feature).toLowerCase();
    return `Your current plan does not include ${featureLabel}. Please upgrade your plan to continue.`;
  }

  return null;
}
