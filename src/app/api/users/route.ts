import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum([
    "admin",
    "business_owner",
    "author",
    "editor",
    "subscriber",
    "guest",
  ]),
  slug: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  businessId: z.string().optional().nullable(),
});

export async function GET() {
  const data = await prisma.user.findMany();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = createUserSchema.parse(body);
  const created = await prisma.user.create({ data: parsed });
  return NextResponse.json(created, { status: 201 });
}
