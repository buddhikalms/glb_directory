import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  getOwnedBusinessPlanContext,
  getPlanFeatureAccessError,
} from "@/lib/owned-business-plan";
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
  const context = await getOwnedBusinessPlanContext(session.user.id, id);
  if (!context) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const featureError = getPlanFeatureAccessError(context, "services");
  if (featureError) {
    return NextResponse.json({ error: featureError }, { status: 403 });
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
  const context = await getOwnedBusinessPlanContext(session.user.id, id);
  if (!context) {
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
