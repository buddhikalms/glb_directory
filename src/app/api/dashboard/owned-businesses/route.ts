import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const businesses = await prisma.business.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      tagline: true,
      coverImage: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ businesses });
}
