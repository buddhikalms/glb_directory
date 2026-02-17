import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
  role: z.enum(["admin", "business_owner", "guest"]).optional(),
  slug: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  businessId: z.string().optional().nullable(),
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const data = await prisma.user.findUnique({ where: { id: params.id } });
  return NextResponse.json(data);
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  const body = await req.json();
  const parsed = updateUserSchema.parse(body);
  const updated = await prisma.user.update({
    where: { id: params.id },
    data: parsed,
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
