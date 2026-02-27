import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  getOwnedBusinessPlanContext,
  getPlanFeatureAccessError,
} from "@/lib/owned-business-plan";
import { prisma } from "@/lib/prisma";

const updateProductSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  price: z.number().finite().nonnegative().optional(),
  image: z.string().trim().optional(),
  inStock: z.boolean().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; productId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, productId } = await params;
  const context = await getOwnedBusinessPlanContext(session.user.id, id);
  if (!context) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const featureError = getPlanFeatureAccessError(context, "products");
  if (featureError) {
    return NextResponse.json({ error: featureError }, { status: 403 });
  }

  const existing = await prisma.product.findFirst({
    where: { id: productId, businessId: id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: parsed.data,
  });

  return NextResponse.json({ product: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; productId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, productId } = await params;
  const context = await getOwnedBusinessPlanContext(session.user.id, id);
  if (!context) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const item = await prisma.product.findFirst({
    where: { id: productId, businessId: id },
    select: { id: true },
  });
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.product.delete({ where: { id: productId } });
  return NextResponse.json({ ok: true });
}
