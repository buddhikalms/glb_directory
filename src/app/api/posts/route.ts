import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createPostSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  category: z.string(),
  authorSlug: z.string(),
  excerpt: z.string(),
  content: z.string(),
  coverImage: z.string(),
  author: z.string(),
  publishedAt: z.string().or(z.date()),
  readTime: z.string(),
  tags: z.array(z.string()),
  featured: z.boolean().optional(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  seoKeywords: z.string().optional().nullable(),
  status: z.enum(["draft", "published"]),
  authorId: z.string(),
});

export async function GET() {
  const data = await prisma.newsPost.findMany({
    include: { authorProfile: true },
  });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = createPostSchema.parse(body);
  const created = await prisma.newsPost.create({
    data: {
      ...parsed,
      publishedAt:
        parsed.publishedAt instanceof Date
          ? parsed.publishedAt
          : new Date(parsed.publishedAt),
      featured: parsed.featured ?? false,
      tags: parsed.tags,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
