import { prisma } from "@/lib/prisma";
import BusinessesClient from "./BusinessesClient";
import type { BusinessRow, CategoryOption, UserOption } from "./types";

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export default async function BusinessesPage() {
  const [businessesRaw, categoriesRaw, ownersRaw] = await Promise.all([
    prisma.business.findMany({
      include: {
        owner: { select: { name: true } },
        category: { select: { name: true } },
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
      logo: item.logo,
      coverImage: item.coverImage,
      ownerId: item.ownerId,
      status: item.status,
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

  return (
    <BusinessesClient
      initialBusinesses={initialBusinesses}
      categories={categories}
      owners={owners}
    />
  );
}
