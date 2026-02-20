import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updateAuthorSchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  title: z.string().optional(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  location: z.string().optional().nullable(),
  links: z.any().optional(),
  userId: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = await prisma.authorProfile.findUnique({
    where: { id },
    include: { user: true },
  });
  return NextResponse.json(data);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = updateAuthorSchema.parse(body);
  const updated = await prisma.authorProfile.update({
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
  await prisma.authorProfile.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
