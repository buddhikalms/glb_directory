import { prisma } from "@/lib/prisma";
import { normalizePackageFeatures } from "@/lib/package-features";
import BusinessesClient from "./BusinessesClient";
import type {
  BadgeOption,
  BusinessRow,
  CategoryOption,
  PricingPackageOption,
  UserOption,
} from "./types";

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

export default async function BusinessesPage() {
  const [businessesRaw, categoriesRaw, ownersRaw, badgesRaw, packagesRaw] =
    await Promise.all([
      prisma.business.findMany({
        include: {
          owner: { select: { name: true } },
          category: { select: { name: true } },
          pricingPackage: {
            select: { id: true, name: true, billingPeriod: true, durationDays: true },
          },
          products: true,
          menuItems: true,
          services: true,
          badges: {
            include: {
              badge: {
                select: {
                  id: true,
                  name: true,
                  icon: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.category.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.user.findMany({
        where: {
          role: { in: ["business_owner", "admin", "editor"] as any },
        },
        select: { id: true, name: true, role: true },
        orderBy: { name: "asc" },
      }),
      prisma.badge.findMany({
        select: { id: true, name: true, icon: true },
        orderBy: { name: "asc" },
      }),
      prisma.pricingPackage.findMany({
        select: {
          id: true,
          name: true,
          billingPeriod: true,
          durationDays: true,
          galleryLimit: true,
          active: true,
          features: true,
        },
        orderBy: { name: "asc" },
      }),
    ]);

  const initialBusinesses: BusinessRow[] = businessesRaw.map((item) => {
    const location = toRecord(item.location);
    const contact = toRecord(item.contact);

    return {
      id: item.id,
      name: item.name,
      slug: item.slug,
      tagline: item.tagline,
      description: item.description,
      seoKeywords: item.seoKeywords || "",
      gallery: toStringArray(item.gallery),
      logo: item.logo,
      coverImage: item.coverImage,
      ownerId: item.ownerId,
      pricingPackageId: item.pricingPackageId || "",
      pricingPackage: item.pricingPackage
        ? {
            id: item.pricingPackage.id,
            name: item.pricingPackage.name,
            billingPeriod: item.pricingPackage.billingPeriod,
            durationDays: item.pricingPackage.durationDays,
          }
        : undefined,
      status: item.status,
      featured: item.featured,
      categoryId: item.categoryId,
      createdAt: item.createdAt.toISOString(),
      location: {
        country: asString(location.country),
        city: asString(location.city),
        address: asString(location.address),
        postcode: asString(location.postcode),
      },
      contact: {
        email: asString(contact.email),
        phone: asString(contact.phone),
        website: asString(contact.website),
      },
      owner: {
        name: item.owner?.name,
      },
      category: {
        name: item.category?.name,
      },
      badgeIds: item.badges.map((entry) => entry.badgeId),
      badges: item.badges.map((entry) => ({
        id: entry.badge.id,
        name: entry.badge.name,
        icon: entry.badge.icon,
      })),
      products: item.products.map((product) => ({
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        inStock: product.inStock,
      })),
      menuItems: item.menuItems.map((menuItem) => ({
        category: menuItem.category,
        name: menuItem.name,
        description: menuItem.description,
        price: menuItem.price,
        dietary: toStringArray(menuItem.dietary),
      })),
      services: item.services.map((service) => ({
        name: service.name,
        description: service.description,
        pricing: service.pricing,
      })),
    };
  });

  const categories: CategoryOption[] = categoriesRaw.map((item) => ({
    id: item.id,
    name: item.name,
  }));

  const owners: UserOption[] = ownersRaw.map((item) => ({
    id: item.id,
    name: item.name,
    role: item.role,
  }));

  const badges: BadgeOption[] = badgesRaw.map((item) => ({
    id: item.id,
    name: item.name,
    icon: item.icon,
  }));

  const packages: PricingPackageOption[] = packagesRaw.map((item) => ({
    id: item.id,
    name: item.name,
    billingPeriod: item.billingPeriod,
    durationDays: item.durationDays,
    galleryLimit: item.galleryLimit,
    active: item.active,
    features: normalizePackageFeatures(item.features),
  }));

  return (
    <BusinessesClient
      initialBusinesses={initialBusinesses}
      categories={categories}
      owners={owners}
      badges={badges}
      packages={packages}
    />
  );
}
