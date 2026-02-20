import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updatePostSchema = z.object({
  title: z.string().optional(),
  slug: z.string().optional(),
  category: z.string().optional(),
  authorSlug: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  coverImage: z.string().optional(),
  author: z.string().optional(),
  publishedAt: z.string().or(z.date()).optional(),
  readTime: z.string().optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  seoKeywords: z.string().optional().nullable(),
  status: z.enum(["draft", "published"]).optional(),
  authorId: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = await prisma.newsPost.findUnique({
    where: { id },
    include: { authorProfile: true },
  });
  return NextResponse.json(data);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = updatePostSchema.parse(body);
  const updated = await prisma.newsPost.update({
    where: { id },
    data: {
      ...parsed,
      ...(parsed.publishedAt
        ? {
            publishedAt:
              parsed.publishedAt instanceof Date
                ? parsed.publishedAt
                : new Date(parsed.publishedAt),
          }
        : {}),
      ...(parsed.tags ? { tags: parsed.tags } : {}),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.newsPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
