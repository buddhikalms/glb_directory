import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createAuthorSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  title: z.string(),
  bio: z.string(),
  avatar: z.string(),
  location: z.string().optional().nullable(),
  links: z.any(),
  userId: z.string(),
});

export async function GET() {
  const data = await prisma.authorProfile.findMany({
    include: { user: true },
  });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = createAuthorSchema.parse(body);
  const created = await prisma.authorProfile.create({ data: parsed });
  return NextResponse.json(created, { status: 201 });
}
