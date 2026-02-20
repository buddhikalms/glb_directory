import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createBusinessSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  tagline: z.string(),
  description: z.string(),
  seoKeywords: z.string().optional(),
  categoryId: z.string(),
  logo: z.string(),
  coverImage: z.string(),
  likes: z.number(),
  location: z.any(),
  contact: z.any(),
  social: z.any(),
  sustainability: z.any(),
  status: z.enum(["pending", "approved", "rejected"]),
  featured: z.boolean(),
  views: z.number(),
  createdAt: z.string().or(z.date()),
  ownerId: z.string(),
  badgeIds: z.array(z.string()).optional(),
});

export async function GET() {
  const data = await prisma.business.findMany({
    include: {
      badges: { include: { badge: true } },
      category: true,
      owner: true,
    },
  });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = createBusinessSchema.parse(body);
  const { badgeIds, createdAt, ...data } = parsed;

  const created = await prisma.business.create({
    data: {
      ...data,
      createdAt: createdAt instanceof Date ? createdAt : new Date(createdAt),
    },
  });

  if (badgeIds?.length) {
    await prisma.businessBadge.createMany({
      data: badgeIds.map((badgeId) => ({
        businessId: created.id,
        badgeId,
      })),
    });
  }

  return NextResponse.json(created, { status: 201 });
}
