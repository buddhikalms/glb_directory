import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BusinessesClient from "../BusinessesClient";
import type {
  BadgeOption,
  BusinessRow,
  CategoryOption,
  PricingPackageOption,
  UserOption,
} from "../types";

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

export default async function EditBusinessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [business, categoriesRaw, ownersRaw, badgesRaw, packagesRaw] =
    await Promise.all([
      prisma.business.findUnique({
        where: { id },
        include: {
          owner: { select: { name: true } },
          category: { select: { name: true } },
          pricingPackage: {
            select: { id: true, name: true, billingPeriod: true },
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
      }),
      prisma.category.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.user.findMany({
        where: {
          role: { in: ["business_owner", "admin", "editor"] as never },
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
          galleryLimit: true,
          active: true,
        },
        orderBy: { name: "asc" },
      }),
    ]);

  if (!business) {
    notFound();
  }

  const location = toRecord(business.location);
  const contact = toRecord(business.contact);

  const initialBusinesses: BusinessRow[] = [
    {
      id: business.id,
      name: business.name,
      slug: business.slug,
      tagline: business.tagline,
      description: business.description,
      seoKeywords: business.seoKeywords || "",
      gallery: toStringArray(business.gallery),
      logo: business.logo,
      coverImage: business.coverImage,
      ownerId: business.ownerId,
      pricingPackageId: business.pricingPackageId || "",
      pricingPackage: business.pricingPackage
        ? {
            id: business.pricingPackage.id,
            name: business.pricingPackage.name,
            billingPeriod: business.pricingPackage.billingPeriod,
          }
        : undefined,
      status: business.status,
      featured: business.featured,
      categoryId: business.categoryId,
      createdAt: business.createdAt.toISOString(),
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
        name: business.owner?.name,
      },
      category: {
        name: business.category?.name,
      },
      badgeIds: business.badges.map((entry) => entry.badgeId),
      badges: business.badges.map((entry) => ({
        id: entry.badge.id,
        name: entry.badge.name,
        icon: entry.badge.icon,
      })),
      products: business.products.map((product) => ({
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        inStock: product.inStock,
      })),
      menuItems: business.menuItems.map((menuItem) => ({
        category: menuItem.category,
        name: menuItem.name,
        description: menuItem.description,
        price: menuItem.price,
        dietary: toStringArray(menuItem.dietary),
      })),
      services: business.services.map((service) => ({
        name: service.name,
        description: service.description,
        pricing: service.pricing,
      })),
    },
  ];

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
    galleryLimit: item.galleryLimit,
    active: item.active,
  }));

  return (
    <BusinessesClient
      initialBusinesses={initialBusinesses}
      categories={categories}
      owners={owners}
      badges={badges}
      packages={packages}
      standaloneForm
      initialEditingId={id}
    />
  );
}
