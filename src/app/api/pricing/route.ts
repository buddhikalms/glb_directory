import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createPricingSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  billingPeriod: z.enum(["monthly", "yearly"]),
  description: z.string(),
  features: z.array(z.string()),
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
  const created = await prisma.pricingPackage.create({
    data: { ...parsed, features: parsed.features },
  });
  return NextResponse.json(created, { status: 201 });
}
