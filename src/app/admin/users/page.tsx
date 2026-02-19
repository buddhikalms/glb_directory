import { prisma } from "@/lib/prisma";
import UsersClient from "./UsersClient";
import type { BusinessOption, UserRow } from "./types";

export default async function UsersPage() {
  const [usersRaw, businessesRaw] = await Promise.all([
    prisma.user.findMany({
      include: {
        business: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.business.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const initialUsers: UserRow[] = usersRaw.map((item) => ({
    id: item.id,
    email: item.email,
    name: item.name,
    role: item.role,
    slug: item.slug || "",
    avatar: item.avatar || "",
    bio: item.bio || "",
    location: item.location || "",
    title: item.title || "",
    businessId: item.businessId || "",
    businessName: item.business?.name || "N/A",
  }));

  const businesses: BusinessOption[] = businessesRaw.map((item) => ({
    id: item.id,
    name: item.name,
  }));

  return <UsersClient initialUsers={initialUsers} businesses={businesses} />;
}

