import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedBusinessId = searchParams.get("businessId");

  if (requestedBusinessId) {
    const business = await prisma.business.findFirst({
      where: { id: requestedBusinessId, ownerId: session.user.id },
    });
    return NextResponse.json({ business });
  }

  const business =
    (session.user.businessId
      ? await prisma.business.findUnique({
          where: { id: session.user.businessId },
        })
      : null) ||
    (await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      orderBy: { createdAt: "desc" },
    }));

  return NextResponse.json({ business });
}
