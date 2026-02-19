"use server";

import { revalidatePath } from "next/cache";
import { BusinessStatus as PrismaBusinessStatus, Prisma } from "@prisma/client";
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

function mapBusinessRow(item: BusinessWithRelations): BusinessRow {
  const location = toRecord(item.location);
  const contact = toRecord(item.contact);

  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    tagline: item.tagline,
    description: item.description,
    logo: item.logo,
    coverImage: item.coverImage,
    ownerId: item.ownerId,
    status: item.status as BusinessStatus,
    featured: item.featured,
    categoryId: item.categoryId,
    createdAt: item.createdAt.toISOString(),
    location: {
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
  };
}

function assertRequired(input: BusinessFormData) {
  if (
    !input.name ||
    !input.slug ||
    !input.tagline ||
    !input.description ||
    !input.categoryId ||
    !input.ownerId
  ) {
    throw new Error("Missing required business fields");
  }
}

export async function createBusinessAction(input: BusinessFormData) {
  assertRequired(input);

  const created = await prisma.business.create({
    data: {
      id: crypto.randomUUID(),
      name: input.name,
      slug: input.slug,
      tagline: input.tagline,
      description: input.description,
      categoryId: input.categoryId,
      logo: input.logo || "",
      coverImage: input.coverImage || "",
      likes: 0,
      location: {
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
    include: {
      owner: { select: { name: true } },
      category: { select: { name: true } },
    },
  });

  revalidatePath("/admin/businesses");
  return mapBusinessRow(created);
}

export async function updateBusinessAction(id: string, input: BusinessFormData) {
  assertRequired(input);

  const updated = await prisma.business.update({
    where: { id },
    data: {
      name: input.name,
      slug: input.slug,
      tagline: input.tagline,
      description: input.description,
      categoryId: input.categoryId,
      logo: input.logo || "",
      coverImage: input.coverImage || "",
      location: {
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
    include: {
      owner: { select: { name: true } },
      category: { select: { name: true } },
    },
  });

  revalidatePath("/admin/businesses");
  return mapBusinessRow(updated);
}

export async function deleteBusinessAction(id: string) {
  await prisma.business.delete({ where: { id } });
  revalidatePath("/admin/businesses");
  return { ok: true };
}

export async function updateBusinessStatusAction(
  id: string,
  status: BusinessStatus,
) {
  const updated = await prisma.business.update({
    where: { id },
    data: { status: status as PrismaBusinessStatus },
    include: {
      owner: { select: { name: true } },
      category: { select: { name: true } },
    },
  });

  revalidatePath("/admin/businesses");
  return mapBusinessRow(updated);
}

