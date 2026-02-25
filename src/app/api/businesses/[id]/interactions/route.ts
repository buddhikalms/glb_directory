import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getBusinessClicks,
  withIncrementedBusinessClicks,
} from "@/lib/business-metrics";

const interactionSchema = z.object({
  action: z.enum(["view", "click", "like", "unlike"]),
});

function toMetrics(business: { views: number; likes: number; contact: unknown }) {
  return {
    views: business.views,
    clicks: getBusinessClicks(business.contact),
    likes: business.likes,
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = interactionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const existing = await prisma.business.findUnique({
    where: { id },
    select: { id: true, views: true, likes: true, contact: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  let updated;
  if (parsed.data.action === "view") {
    updated = await prisma.business.update({
      where: { id },
      data: { views: { increment: 1 } },
      select: { views: true, likes: true, contact: true },
    });
  } else if (parsed.data.action === "like") {
    const likeCookieName = `gd_like_${id}`;
    const alreadyLiked = request.cookies.get(likeCookieName)?.value === "1";
    if (alreadyLiked) {
      return NextResponse.json({
        metrics: toMetrics(existing),
        alreadyLiked: true,
      });
    }

    updated = await prisma.business.update({
      where: { id },
      data: { likes: { increment: 1 } },
      select: { views: true, likes: true, contact: true },
    });

    const response = NextResponse.json({
      metrics: toMetrics(updated),
      alreadyLiked: false,
    });
    response.cookies.set({
      name: likeCookieName,
      value: "1",
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365 * 5,
    });
    return response;
  } else if (parsed.data.action === "unlike") {
    const likeCookieName = `gd_like_${id}`;
    const alreadyLiked = request.cookies.get(likeCookieName)?.value === "1";
    if (!alreadyLiked) {
      return NextResponse.json({
        metrics: toMetrics(existing),
        alreadyLiked: false,
      });
    }

    if (existing.likes > 0) {
      updated = await prisma.business.update({
        where: { id },
        data: { likes: { decrement: 1 } },
        select: { views: true, likes: true, contact: true },
      });
    } else {
      updated = existing;
    }

    const response = NextResponse.json({
      metrics: toMetrics(updated),
      alreadyLiked: false,
    });
    response.cookies.set({
      name: likeCookieName,
      value: "",
      path: "/",
      sameSite: "lax",
      maxAge: 0,
    });
    return response;
  } else {
    updated = await prisma.business.update({
      where: { id },
      data: {
        contact: withIncrementedBusinessClicks(
          existing.contact,
          1,
        ) as Prisma.InputJsonValue,
      },
      select: { views: true, likes: true, contact: true },
    });
  }

  return NextResponse.json({ metrics: toMetrics(updated) });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const business = await prisma.business.findUnique({
    where: { id },
    select: { views: true, likes: true, contact: true },
  });

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  return NextResponse.json({ metrics: toMetrics(business) });
}
