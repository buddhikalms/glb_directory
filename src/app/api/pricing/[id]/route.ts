import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updatePricingSchema = z.object({
  name: z.string().optional(),
  price: z.number().optional(),
  billingPeriod: z.enum(["monthly", "yearly"]).optional(),
  durationDays: z.number().int().min(1).max(365).optional(),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  galleryLimit: z.number().int().min(0).optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = await prisma.pricingPackage.findUnique({
    where: { id },
  });
  return NextResponse.json(data);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = updatePricingSchema.parse(body);
  const updated = await prisma.pricingPackage.update({
    where: { id },
    data: { ...parsed, features: parsed.features },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.pricingPackage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
