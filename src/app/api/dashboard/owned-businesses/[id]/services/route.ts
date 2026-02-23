import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const createServiceSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  pricing: z.string().trim().min(1),
});

async function ensureOwnership(ownerId: string, businessId: string) {
  return prisma.business.findFirst({
    where: { id: businessId, ownerId },
    select: { id: true },
  });
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
  const owned = await ensureOwnership(session.user.id, id);
  if (!owned) {
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
  const owned = await ensureOwnership(session.user.id, id);
  if (!owned) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
