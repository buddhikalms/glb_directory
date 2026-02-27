import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getOwnedBusinessPlanContext } from "@/lib/owned-business-plan";
import { prisma } from "@/lib/prisma";

const updateBusinessSchema = z.object({
  name: z.string().trim().min(1).optional(),
  slug: z.string().trim().min(1).optional(),
  tagline: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  seoKeywords: z.string().trim().optional(),
  categoryId: z.string().trim().optional(),
  logo: z.string().trim().optional(),
  coverImage: z.string().trim().optional(),
  gallery: z.array(z.string().trim()).optional(),
  location: z.any().optional(),
  contact: z.any().optional(),
  social: z.any().optional(),
  sustainability: z.any().optional(),
  badgeIds: z.array(z.string()).optional(),
});

async function ensureOwnership(userId: string, id: string) {
  return prisma.business.findFirst({
    where: { id, ownerId: userId },
    select: { id: true },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const context = await getOwnedBusinessPlanContext(session.user.id, id);
  if (!context) {
    return NextResponse.json(
      { error: "Listing not found or not owned by current user." },
      { status: 404 },
    );
  }

  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      badges: true,
    },
  });

  return NextResponse.json({ business });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const context = await getOwnedBusinessPlanContext(session.user.id, id);
  if (!context) {
    return NextResponse.json(
      { error: "Listing not found or not owned by current user." },
      { status: 404 },
    );
  }

  const body = await request.json();
  const parsed = updateBusinessSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { badgeIds, ...data } = parsed.data;
  const updateData = { ...data };
  const canUseBranding = context.enabledFeatures.has("branding");
  const canUseGallery = context.enabledFeatures.has("gallery");
  const canUseBadges = context.enabledFeatures.has("badges");

  if (!canUseBranding) {
    delete updateData.logo;
    delete updateData.coverImage;
  }

  if (!canUseGallery) {
    delete updateData.gallery;
  } else if (Array.isArray(updateData.gallery)) {
    updateData.gallery = updateData.gallery.slice(0, context.galleryLimit);
  }

  await prisma.$transaction(async (tx) => {
    await tx.business.update({
      where: { id },
      data: updateData,
    });

    if (badgeIds && canUseBadges) {
      await tx.businessBadge.deleteMany({ where: { businessId: id } });
      if (badgeIds.length > 0) {
        await tx.businessBadge.createMany({
          data: badgeIds.map((badgeId) => ({ businessId: id, badgeId })),
        });
      }
    }
  });

  const business = await prisma.business.findUnique({
    where: { id },
    include: { badges: true },
  });

  return NextResponse.json({ business });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const business = await ensureOwnership(session.user.id, id);

  if (!business) {
    return NextResponse.json(
      { error: "Listing not found or not owned by current user." },
      { status: 404 },
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.businessBadge.deleteMany({ where: { businessId: id } });
    await tx.product.deleteMany({ where: { businessId: id } });
    await tx.menuItem.deleteMany({ where: { businessId: id } });
    await tx.service.deleteMany({ where: { businessId: id } });
    await tx.review.deleteMany({ where: { businessId: id } });
    await tx.business.delete({ where: { id } });
  });

  return NextResponse.json({ ok: true });
}
