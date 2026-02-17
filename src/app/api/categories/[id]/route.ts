import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updateCategorySchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  icon: z.string().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const data = await prisma.category.findUnique({ where: { id: params.id } });
  return NextResponse.json(data);
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  const body = await req.json();
  const parsed = updateCategorySchema.parse(body);
  const updated = await prisma.category.update({
    where: { id: params.id },
    data: parsed,
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  await prisma.category.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
