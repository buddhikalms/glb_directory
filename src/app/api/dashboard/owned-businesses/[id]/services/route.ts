import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  getOwnedBusinessPlanContext,
  getPlanFeatureAccessError,
} from "@/lib/owned-business-plan";
import { prisma } from "@/lib/prisma";

const createServiceSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  pricing: z.string().trim().min(1),
});

async function ensureOwnership(ownerId: string, businessId: string) {
  return getOwnedBusinessPlanContext(ownerId, businessId);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const context = await ensureOwnership(session.user.id, id);
  if (!context) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const services = await prisma.service.findMany({
    where: { businessId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ services });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const context = await ensureOwnership(session.user.id, id);
  if (!context) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const featureError = getPlanFeatureAccessError(context, "services");
  if (featureError) {
    return NextResponse.json({ error: featureError }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createServiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const created = await prisma.service.create({
    data: {
      businessId: id,
      name: parsed.data.name,
      description: parsed.data.description,
      pricing: parsed.data.pricing,
    },
  });

  return NextResponse.json({ service: created }, { status: 201 });
}
