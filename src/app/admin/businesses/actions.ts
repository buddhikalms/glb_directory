"use server";

import { revalidatePath } from "next/cache";
import { BusinessStatus as PrismaBusinessStatus, Prisma } from "@prisma/client";
import {
  sendListingApprovedEmail,
  sendListingRejectedEmail,
} from "@/lib/auth-email";
import { prisma } from "@/lib/prisma";
import type { BusinessFormData, BusinessRow, BusinessStatus } from "./types";

type BusinessWithRelations = Prisma.BusinessGetPayload<{
  include: {
    owner: {
      select: {
        name: true;
      };
    };
    category: {
      select: {
        name: true;
      };
    };
    badges: {
      include: {
        badge: {
          select: {
            id: true;
            name: true;
            icon: true;
          };
        };
      };
    };
    pricingPackage: {
      select: {
        id: true;
        name: true;
        billingPeriod: true;
      };
    };
    products: true;
    menuItems: true;
    services: true;
  };
}>;

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

function getBusinessContactEmail(item: {
  contact: unknown;
  owner?: unknown;
}) {
  const contact = toRecord(item.contact);
  const contactEmail = asString(contact.email);
  const owner = toRecord(item.owner);
  const ownerEmail = asString(owner.email);
  return contactEmail || ownerEmail || "";
}

function mapBusinessRow(item: BusinessWithRelations): BusinessRow {
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
        }
      : undefined,
    status: item.status as BusinessStatus,
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
}

function assertRequired(input: BusinessFormData) {
  if (
    !input.name ||
    !input.slug ||
    !input.tagline ||
    !input.description ||
    !input.categoryId ||
    !input.ownerId ||
    !input.country ||
    !input.city
  ) {
    throw new Error("Missing required business fields");
  }
}

function normalizeProducts(input: BusinessFormData) {
  return input.products
    .map((item) => ({
      name: item.name.trim(),
      description: item.description.trim(),
      price: Number.isFinite(item.price) ? item.price : 0,
      image: item.image.trim(),
      inStock: Boolean(item.inStock),
    }))
    .filter((item) => item.name && item.description);
}

function normalizeMenuItems(input: BusinessFormData) {
  return input.menuItems
    .map((item) => ({
      category: item.category.trim(),
      name: item.name.trim(),
      description: item.description.trim(),
      price: Number.isFinite(item.price) ? item.price : 0,
      dietary: item.dietary.filter((value) => Boolean(value.trim())),
    }))
    .filter((item) => item.name && item.description);
}

function normalizeServices(input: BusinessFormData) {
  return input.services
    .map((item) => ({
      name: item.name.trim(),
      description: item.description.trim(),
      pricing: item.pricing.trim(),
    }))
    .filter((item) => item.name && item.description);
}

async function clampGalleryToPackageLimit(
  tx: Prisma.TransactionClient,
  input: BusinessFormData,
) {
  const gallery = Array.isArray(input.gallery) ? input.gallery : [];
  if (!input.pricingPackageId) return gallery;

  const pricingPackage = await tx.pricingPackage.findUnique({
    where: { id: input.pricingPackageId },
    select: { galleryLimit: true },
  });

  if (!pricingPackage) return gallery;
  const limit = Math.max(pricingPackage.galleryLimit, 0);
  return gallery.slice(0, limit);
}

export async function createBusinessAction(input: BusinessFormData) {
  assertRequired(input);

  const businessId = crypto.randomUUID();

  await prisma.$transaction(async (tx) => {
    const gallery = await clampGalleryToPackageLimit(tx, input);
    const products = normalizeProducts(input);
    const menuItems = normalizeMenuItems(input);
    const services = normalizeServices(input);

    await tx.business.create({
      data: {
        id: businessId,
        name: input.name,
        slug: input.slug,
        tagline: input.tagline,
        description: input.description,
        seoKeywords: input.seoKeywords?.trim() || null,
        gallery,
        categoryId: input.categoryId,
        pricingPackageId: input.pricingPackageId || null,
        logo: input.logo || "",
        coverImage: input.coverImage || "",
        likes: 0,
        location: {
          country: input.country || "",
          city: input.city || "",
          address: input.address || "",
          postcode: input.postcode || "",
        },
        contact: {
          email: input.email || "",
          phone: input.phone || "",
          website: input.website || "",
        },
        social: {},
        sustainability: [],
        status: input.status as PrismaBusinessStatus,
        featured: input.featured,
        views: 0,
        ownerId: input.ownerId,
      },
    });

    if (input.badgeIds.length > 0) {
      await tx.businessBadge.createMany({
        data: input.badgeIds.map((badgeId) => ({ businessId, badgeId })),
      });
    }

    if (products.length > 0) {
      await tx.product.createMany({
        data: products.map((item) => ({
          id: crypto.randomUUID(),
          businessId,
          name: item.name,
          description: item.description,
          price: item.price,
          image: item.image,
          inStock: item.inStock,
        })),
      });
    }

    if (menuItems.length > 0) {
      await tx.menuItem.createMany({
        data: menuItems.map((item) => ({
          id: crypto.randomUUID(),
          businessId,
          category: item.category,
          name: item.name,
          description: item.description,
          price: item.price,
          dietary: item.dietary,
        })),
      });
    }

    if (services.length > 0) {
      await tx.service.createMany({
        data: services.map((item) => ({
          id: crypto.randomUUID(),
          businessId,
          name: item.name,
          description: item.description,
          pricing: item.pricing,
        })),
      });
    }
  });

  const created = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    include: {
      owner: { select: { name: true } },
      category: { select: { name: true } },
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
      pricingPackage: {
        select: { id: true, name: true, billingPeriod: true },
      },
      products: true,
      menuItems: true,
      services: true,
    },
  });

  revalidatePath("/admin/businesses");
  return mapBusinessRow(created);
}

export async function updateBusinessAction(id: string, input: BusinessFormData) {
  assertRequired(input);

  const previous = await prisma.business.findUnique({
    where: { id },
    select: {
      status: true,
      name: true,
      contact: true,
      owner: { select: { name: true, email: true } },
    },
  });

  await prisma.$transaction(async (tx) => {
    const gallery = await clampGalleryToPackageLimit(tx, input);
    const products = normalizeProducts(input);
    const menuItems = normalizeMenuItems(input);
    const services = normalizeServices(input);

    await tx.business.update({
      where: { id },
      data: {
        name: input.name,
        slug: input.slug,
        tagline: input.tagline,
        description: input.description,
        seoKeywords: input.seoKeywords?.trim() || null,
        gallery,
        categoryId: input.categoryId,
        pricingPackageId: input.pricingPackageId || null,
        logo: input.logo || "",
        coverImage: input.coverImage || "",
        location: {
          country: input.country || "",
          city: input.city || "",
          address: input.address || "",
          postcode: input.postcode || "",
        },
        contact: {
          email: input.email || "",
          phone: input.phone || "",
          website: input.website || "",
        },
        status: input.status as PrismaBusinessStatus,
        featured: input.featured,
        ownerId: input.ownerId,
      },
    });

    await tx.businessBadge.deleteMany({ where: { businessId: id } });
    if (input.badgeIds.length > 0) {
      await tx.businessBadge.createMany({
        data: input.badgeIds.map((badgeId) => ({ businessId: id, badgeId })),
      });
    }

    await tx.product.deleteMany({ where: { businessId: id } });
    if (products.length > 0) {
      await tx.product.createMany({
        data: products.map((item) => ({
          id: crypto.randomUUID(),
          businessId: id,
          name: item.name,
          description: item.description,
          price: item.price,
          image: item.image,
          inStock: item.inStock,
        })),
      });
    }

    await tx.menuItem.deleteMany({ where: { businessId: id } });
    if (menuItems.length > 0) {
      await tx.menuItem.createMany({
        data: menuItems.map((item) => ({
          id: crypto.randomUUID(),
          businessId: id,
          category: item.category,
          name: item.name,
          description: item.description,
          price: item.price,
          dietary: item.dietary,
        })),
      });
    }

    await tx.service.deleteMany({ where: { businessId: id } });
    if (services.length > 0) {
      await tx.service.createMany({
        data: services.map((item) => ({
          id: crypto.randomUUID(),
          businessId: id,
          name: item.name,
          description: item.description,
          pricing: item.pricing,
        })),
      });
    }
  });

  const updated = await prisma.business.findUniqueOrThrow({
    where: { id },
    include: {
      owner: { select: { name: true } },
      category: { select: { name: true } },
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
      pricingPackage: {
        select: { id: true, name: true, billingPeriod: true },
      },
      products: true,
      menuItems: true,
      services: true,
    },
  });

  if (previous && previous.status !== updated.status) {
    const to = getBusinessContactEmail(updated);
    if (to && updated.status === "approved") {
      try {
        await sendListingApprovedEmail({
          to,
          name: updated.owner?.name || undefined,
          businessName: updated.name,
        });
      } catch (error) {
        console.error("listing_approved_email_error", error);
      }
    }

    if (to && updated.status === "rejected") {
      try {
        await sendListingRejectedEmail({
          to,
          name: updated.owner?.name || undefined,
          businessName: updated.name,
          reason: "Your listing did not meet the review requirements.",
        });
      } catch (error) {
        console.error("listing_rejected_email_error", error);
      }
    }
  }

  revalidatePath("/admin/businesses");
  return mapBusinessRow(updated);
}

export async function deleteBusinessAction(id: string) {
  await prisma.$transaction(async (tx) => {
    await tx.businessBadge.deleteMany({ where: { businessId: id } });
    await tx.business.delete({ where: { id } });
  });

  revalidatePath("/admin/businesses");
  return { ok: true };
}

export async function updateBusinessStatusAction(
  id: string,
  status: BusinessStatus,
  rejectReason?: string,
) {
  const previous = await prisma.business.findUnique({
    where: { id },
    select: {
      status: true,
      name: true,
      contact: true,
      owner: { select: { name: true, email: true } },
    },
  });

  const updated = await prisma.business.update({
    where: { id },
    data: { status: status as PrismaBusinessStatus },
    include: {
      owner: { select: { name: true } },
      category: { select: { name: true } },
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
      pricingPackage: {
        select: { id: true, name: true, billingPeriod: true },
      },
      products: true,
      menuItems: true,
      services: true,
    },
  });

  if (previous && previous.status !== updated.status) {
    const to = getBusinessContactEmail(updated);
    if (to && updated.status === "approved") {
      try {
        await sendListingApprovedEmail({
          to,
          name: updated.owner?.name || undefined,
          businessName: updated.name,
        });
      } catch (error) {
        console.error("listing_approved_email_error", error);
      }
    }

    if (to && updated.status === "rejected") {
      try {
        await sendListingRejectedEmail({
          to,
          name: updated.owner?.name || undefined,
          businessName: updated.name,
          reason: rejectReason || undefined,
        });
      } catch (error) {
        console.error("listing_rejected_email_error", error);
      }
    }
  }

  revalidatePath("/admin/businesses");
  return mapBusinessRow(updated);
}
