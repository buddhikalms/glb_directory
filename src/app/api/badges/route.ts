import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createBadgeSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  icon: z.string(),
  color: z.string(),
});

export async function GET() {
  const data = await prisma.badge.findMany();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = createBadgeSchema.parse(body);
  const created = await prisma.badge.create({ data: parsed });
  return NextResponse.json(created, { status: 201 });
}
