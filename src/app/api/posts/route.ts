import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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

const LEGACY_TEXT_SAFE_LIMIT = 50000;

export async function GET() {
  const data = await prisma.newsPost.findMany({
    include: { authorProfile: true },
  });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createPostSchema.parse(body);
    if (parsed.content.length > LEGACY_TEXT_SAFE_LIMIT) {
      return NextResponse.json(
        {
          error:
            "Post content is too large for the current DB column. Run `npx prisma db push` to apply `NewsPost.content @db.LongText`, then retry.",
        },
        { status: 400 },
      );
    }
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
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2000") {
        return NextResponse.json(
          {
            error:
              "Post content is too large for your current DB column. Run `npx prisma db push` to apply `NewsPost.content @db.LongText`, then retry.",
          },
          { status: 400 },
        );
      }
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid post payload.", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create post." },
      { status: 500 },
    );
  }
}
