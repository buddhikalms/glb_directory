import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updateBadgeSchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = await prisma.badge.findUnique({ where: { id } });
  return NextResponse.json(data);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = updateBadgeSchema.parse(body);
  const updated = await prisma.badge.update({
    where: { id },
    data: parsed,
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.badge.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
