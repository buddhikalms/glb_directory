import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updateBusinessSchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  seoKeywords: z.string().optional(),
  categoryId: z.string().optional(),
  logo: z.string().optional(),
  coverImage: z.string().optional(),
  likes: z.number().optional(),
  location: z.any().optional(),
  contact: z.any().optional(),
  social: z.any().optional(),
  sustainability: z.any().optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  featured: z.boolean().optional(),
  views: z.number().optional(),
  createdAt: z.string().or(z.date()).optional(),
  ownerId: z.string().optional(),
  badgeIds: z.array(z.string()).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = await prisma.business.findUnique({
    where: { id },
    include: {
      badges: { include: { badge: true } },
      category: true,
      owner: true,
      products: true,
      services: true,
      menuItems: true,
      reviews: true,
    },
  });
  return NextResponse.json(data);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = updateBusinessSchema.parse(body);
  const { badgeIds, createdAt, ...data } = parsed;

  const updated = await prisma.business.update({
    where: { id },
    data: {
      ...data,
      ...(createdAt
        ? { createdAt: createdAt instanceof Date ? createdAt : new Date(createdAt) }
        : {}),
    },
  });

  if (badgeIds) {
    await prisma.businessBadge.deleteMany({ where: { businessId: id } });
    if (badgeIds.length) {
      await prisma.businessBadge.createMany({
        data: badgeIds.map((badgeId) => ({
          businessId: id,
          badgeId,
        })),
      });
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.business.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
