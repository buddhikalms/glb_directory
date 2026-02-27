import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { executePlanDowngrade } from "@/lib/downgrade-execution";
import {
  decideDowngradeRequest,
  getDowngradeRequestById,
} from "@/lib/downgrade-policy-store";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  decision: z.enum(["approve", "reject"]),
});

function isAdmin(role: string | undefined) {
  return role === "admin";
}

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const { id: requestId } = await context.params;
    const downgradeRequest = await getDowngradeRequestById(requestId);
    if (!downgradeRequest) {
      return NextResponse.json(
        { error: "Downgrade request not found." },
        { status: 404 },
      );
    }

    if (downgradeRequest.status !== "pending") {
      return NextResponse.json(
        { error: "Downgrade request is already processed." },
        { status: 400 },
      );
    }

    if (parsed.data.decision === "reject") {
      const updated = await decideDowngradeRequest({
        id: requestId,
        decision: "rejected",
        decidedByUserId: session.user.id,
        decidedByName: session.user.name || null,
      });
      return NextResponse.json({ ok: true, request: updated });
    }

    const business = await prisma.business.findUnique({
      where: { id: downgradeRequest.businessId },
      select: {
        id: true,
        name: true,
        ownerId: true,
        pricingPackageId: true,
      },
    });

    if (!business || business.ownerId !== downgradeRequest.ownerUserId) {
      return NextResponse.json(
        { error: "Business no longer matches this downgrade request." },
        { status: 400 },
      );
    }

    const targetPackage = await prisma.pricingPackage.findUnique({
      where: { id: downgradeRequest.targetPackageId },
      select: {
        id: true,
        active: true,
        price: true,
      },
    });

    if (!targetPackage || !targetPackage.active) {
      return NextResponse.json(
        { error: "Target package is no longer valid." },
        { status: 400 },
      );
    }

    if (targetPackage.price <= 0) {
      return NextResponse.json(
        { error: "Downgrading to a free plan is not allowed." },
        { status: 400 },
      );
    }

    if (business.pricingPackageId !== targetPackage.id) {
      await executePlanDowngrade({
        ownerUserId: downgradeRequest.ownerUserId,
        ownerEmail: downgradeRequest.ownerEmail,
        businessId: business.id,
        currentPackageId: business.pricingPackageId,
        targetPackageId: targetPackage.id,
      });
    }

    const updated = await decideDowngradeRequest({
      id: requestId,
      decision: "approved",
      decidedByUserId: session.user.id,
      decidedByName: session.user.name || null,
    });

    return NextResponse.json({
      ok: true,
      request: updated,
      message: "Downgrade approved and applied.",
    });
  } catch (error) {
    console.error("downgrade_request_decision_error", error);
    return NextResponse.json(
      { error: "Failed to process downgrade request." },
      { status: 500 },
    );
  }
}
