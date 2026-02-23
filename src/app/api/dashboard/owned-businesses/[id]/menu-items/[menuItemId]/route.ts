import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const updateMenuItemSchema = z.object({
  category: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  price: z.number().finite().nonnegative().optional(),
  dietary: z.array(z.string().trim()).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; menuItemId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, menuItemId } = await params;
  const business = await prisma.business.findFirst({
    where: { id, ownerId: session.user.id },
    select: { id: true },
  });
  if (!business) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await prisma.menuItem.findFirst({
    where: { id: menuItemId, businessId: id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateMenuItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const updated = await prisma.menuItem.update({
    where: { id: menuItemId },
    data: parsed.data,
  });

  return NextResponse.json({ menuItem: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; menuItemId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, menuItemId } = await params;
  const business = await prisma.business.findFirst({
    where: { id, ownerId: session.user.id },
    select: { id: true },
  });
  if (!business) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const item = await prisma.menuItem.findFirst({
    where: { id: menuItemId, businessId: id },
    select: { id: true },
  });
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.menuItem.delete({ where: { id: menuItemId } });
  return NextResponse.json({ ok: true });
}
