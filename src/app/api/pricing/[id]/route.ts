import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updatePricingSchema = z.object({
  name: z.string().optional(),
  price: z.number().optional(),
  billingPeriod: z.enum(["monthly", "yearly"]).optional(),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const data = await prisma.pricingPackage.findUnique({
    where: { id: params.id },
  });
  return NextResponse.json(data);
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  const body = await req.json();
  const parsed = updatePricingSchema.parse(body);
  const updated = await prisma.pricingPackage.update({
    where: { id: params.id },
    data: { ...parsed, features: parsed.features },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  await prisma.pricingPackage.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
