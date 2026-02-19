import { prisma } from "@/lib/prisma";
import DirectoryClient from "./DirectoryClient";

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export default async function DirectoryPage() {
  const [businessesRaw, categories, badges] = await Promise.all([
    prisma.business.findMany({
      where: { status: "approved" },
      include: {
        category: { select: { id: true, name: true, icon: true } },
        badges: { include: { badge: true } },
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
    return {
      id: item.id,
      slug: item.slug,
      name: item.name,
      tagline: item.tagline,
      coverImage: item.coverImage,
      logo: item.logo,
      featured: item.featured,
      likes: item.likes,
      categoryId: item.categoryId,
      city: asString(location.city),
      badgeIds: item.badges.map((b) => b.badgeId),
      category: item.category,
      badges: item.badges.map((b) => b.badge),
    };
  });

  return (
    <DirectoryClient
      businesses={businesses}
      categories={categories}
      badges={badges}
    />
  );
}

