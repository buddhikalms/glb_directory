import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const updateServiceSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  pricing: z.string().trim().min(1).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; serviceId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, serviceId } = await params;
  const business = await prisma.business.findFirst({
    where: { id, ownerId: session.user.id },
    select: { id: true },
  });
  if (!business) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await prisma.service.findFirst({
    where: { id: serviceId, businessId: id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateServiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: parsed.data,
  });

  return NextResponse.json({ service: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; serviceId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, serviceId } = await params;
  const business = await prisma.business.findFirst({
    where: { id, ownerId: session.user.id },
    select: { id: true },
  });
  if (!business) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const item = await prisma.service.findFirst({
    where: { id: serviceId, businessId: id },
    select: { id: true },
  });
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.service.delete({ where: { id: serviceId } });
  return NextResponse.json({ ok: true });
}
