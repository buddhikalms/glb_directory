import { prisma } from "@/lib/prisma";
import BusinessesClient from "../BusinessesClient";
import type {
  BadgeOption,
  CategoryOption,
  PricingPackageOption,
  UserOption,
} from "../types";

export default async function NewBusinessPage() {
  const [categoriesRaw, ownersRaw, badgesRaw, packagesRaw] = await Promise.all([
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
      initialBusinesses={[]}
      categories={categories}
      owners={owners}
      badges={badges}
      packages={packages}
      standaloneForm
    />
  );
}
