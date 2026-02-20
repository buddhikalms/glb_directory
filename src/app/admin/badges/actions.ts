"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { BadgeFormData, BadgeRow } from "./types";

function assertRequired(input: BadgeFormData) {
  if (!input.name || !input.slug || !input.icon || !input.color) {
    throw new Error("Missing required badge fields");
  }
}

function mapBadgeRow(item: {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  _count: { businesses: number };
}): BadgeRow {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    icon: item.icon,
    color: item.color,
    usageCount: item._count.businesses,
  };
}

function revalidateBadgePaths() {
  revalidatePath("/admin/badges");
  revalidatePath("/admin/businesses");
  revalidatePath("/directory");
  revalidatePath("/");
}

export async function createBadgeAction(input: BadgeFormData) {
  assertRequired(input);

  const created = await prisma.badge.create({
    data: {
      id: crypto.randomUUID(),
      name: input.name,
      slug: input.slug,
      icon: input.icon,
      color: input.color,
    },
    include: {
      _count: {
        select: {
          businesses: true,
        },
      },
    },
  });

  revalidateBadgePaths();
  return mapBadgeRow(created);
}

export async function updateBadgeAction(id: string, input: BadgeFormData) {
  assertRequired(input);

  const updated = await prisma.badge.update({
    where: { id },
    data: {
      name: input.name,
      slug: input.slug,
      icon: input.icon,
      color: input.color,
    },
    include: {
      _count: {
        select: {
          businesses: true,
        },
      },
    },
  });

  revalidateBadgePaths();
  return mapBadgeRow(updated);
}

export async function deleteBadgeAction(id: string) {
  await prisma.$transaction(async (tx) => {
    await tx.businessBadge.deleteMany({ where: { badgeId: id } });
    await tx.badge.delete({ where: { id } });
  });

  revalidateBadgePaths();
  return { ok: true };
}
