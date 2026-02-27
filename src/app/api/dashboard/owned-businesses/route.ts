import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { applyExpiredListingFallbackForOwner } from "@/lib/expired-listing-fallback";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await applyExpiredListingFallbackForOwner(session.user.id);

  const businesses = await prisma.business.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      tagline: true,
      coverImage: true,
      pricingPackageId: true,
      pricingPackage: {
        select: {
          id: true,
          name: true,
        },
      },
      createdAt: true,
    },
  });

  return NextResponse.json({ businesses });
}
