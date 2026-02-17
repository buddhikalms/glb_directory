import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createReviewSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  authorName: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string(),
  createdAt: z.string().or(z.date()),
  flagged: z.boolean().optional(),
});

export async function GET() {
  const data = await prisma.review.findMany({ include: { business: true } });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = createReviewSchema.parse(body);
  const created = await prisma.review.create({
    data: {
      ...parsed,
      createdAt: parsed.createdAt instanceof Date ? parsed.createdAt : new Date(parsed.createdAt),
      flagged: parsed.flagged ?? false,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
