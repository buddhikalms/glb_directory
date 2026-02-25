import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getBusinessClicks } from "@/lib/business-metrics";

function toBusinessWithMetrics<
  T extends {
    contact: unknown;
    likes: number;
    views: number;
    reviews: Array<{ rating: number }>;
  },
>(business: T | null) {
  if (!business) return null;
  const reviewCount = business.reviews.length;
  const averageRating =
    reviewCount > 0
      ? business.reviews.reduce((sum, review) => sum + review.rating, 0) /
        reviewCount
      : 0;

  return {
    ...business,
    clicks: getBusinessClicks(business.contact),
    reviewCount,
    averageRating,
  };
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedBusinessId = searchParams.get("businessId");

  if (requestedBusinessId) {
    const business = await prisma.business.findFirst({
      where: { id: requestedBusinessId, ownerId: session.user.id },
      include: {
        reviews: { select: { rating: true } },
      },
    });
    return NextResponse.json({ business: toBusinessWithMetrics(business) });
  }

  const business =
    (session.user.businessId
      ? await prisma.business.findUnique({
          where: { id: session.user.businessId },
          include: {
            reviews: { select: { rating: true } },
          },
        })
      : null) ||
    (await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        reviews: { select: { rating: true } },
      },
    }));

  return NextResponse.json({ business: toBusinessWithMetrics(business) });
}
