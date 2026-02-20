import { prisma } from "@/lib/prisma";
import BadgesClient from "./BadgesClient";
import type { BadgeRow } from "./types";

export default async function BadgesPage() {
  const badgesRaw = await prisma.badge.findMany({
    include: {
      _count: {
        select: {
          businesses: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const initialBadges: BadgeRow[] = badgesRaw.map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    icon: item.icon,
    color: item.color,
    usageCount: item._count.businesses,
  }));

  return <BadgesClient initialBadges={initialBadges} />;
}
