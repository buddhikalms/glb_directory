import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updateReviewSchema = z.object({
  authorName: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().optional(),
  createdAt: z.string().or(z.date()).optional(),
  flagged: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = await prisma.review.findUnique({
    where: { id },
    include: { business: true },
  });
  return NextResponse.json(data);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = updateReviewSchema.parse(body);
  const updated = await prisma.review.update({
    where: { id },
    data: {
      ...parsed,
      ...(parsed.createdAt
        ? {
            createdAt:
              parsed.createdAt instanceof Date
                ? parsed.createdAt
                : new Date(parsed.createdAt),
          }
        : {}),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.review.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
