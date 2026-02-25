import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createPricingSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  price: z.number(),
  billingPeriod: z.enum(["monthly", "yearly"]),
  durationDays: z.number().int().min(1).max(365),
  description: z.string(),
  features: z.array(z.string()),
  galleryLimit: z.number().int().min(0),
  featured: z.boolean(),
  active: z.boolean(),
});

export async function GET() {
  const data = await prisma.pricingPackage.findMany();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = createPricingSchema.parse(body);
  const { id, ...rest } = parsed;
  const created = await prisma.pricingPackage.create({
    data: { id: id || crypto.randomUUID(), ...rest, features: rest.features },
  });
  return NextResponse.json(created, { status: 201 });
}
