import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  sendPaymentReceivedEmail,
  sendPlanUpgradedEmail,
} from "@/lib/auth-email";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";

const bodySchema = z.object({
  sessionId: z.string().trim().min(1),
  businessId: z.string().trim().min(1),
  selectedPackage: z.string().trim().min(1),
  paymentMode: z.enum(["subscription", "one_time"]).optional().default("subscription"),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }
    if (parsed.data.sessionId.includes("CHECKOUT_SESSION_ID")) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid upgrade session id. Please retry the upgrade from the Billing page.",
        },
        { status: 400 },
      );
    }

    const business = await prisma.business.findFirst({
      where: { id: parsed.data.businessId, ownerId: session.user.id },
      select: {
        id: true,
        name: true,
        pricingPackageId: true,
        pricingPackage: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    if (!business) {
      return NextResponse.json(
        { error: "Listing not found or not owned by current user." },
        { status: 404 },
      );
    }

    const stripe = getStripeClient();
    const checkoutSession = await stripe.checkout.sessions.retrieve(
      parsed.data.sessionId,
    );

    const metadata = checkoutSession.metadata || {};
    const isUpgradeFlow = metadata.flow === "plan_upgrade";
    const isOwner = metadata.userId === session.user.id;
    const businessMatches = metadata.businessId === parsed.data.businessId;
    const packageMatches = metadata.selectedPackage === parsed.data.selectedPackage;
    const paymentModeMatches =
      (metadata.paymentMode || "subscription") === parsed.data.paymentMode;
    const completed = checkoutSession.status === "complete";
    const expectedMode =
      parsed.data.paymentMode === "one_time" ? "payment" : "subscription";
    const checkoutModeMatches = checkoutSession.mode === expectedMode;

    if (
      !isUpgradeFlow ||
      !isOwner ||
      !businessMatches ||
      !packageMatches ||
      !paymentModeMatches ||
      !completed ||
      !checkoutModeMatches
    ) {
      return NextResponse.json(
        { ok: false, error: "Payment verification failed." },
        { status: 400 },
      );
    }

    const pricingPackage = await prisma.pricingPackage.findUnique({
      where: { id: parsed.data.selectedPackage },
      select: { id: true, name: true, active: true },
    });
    if (!pricingPackage || !pricingPackage.active) {
      return NextResponse.json(
        { ok: false, error: "Selected package is invalid." },
        { status: 400 },
      );
    }

    if (business.pricingPackageId !== pricingPackage.id) {
      await prisma.business.update({
        where: { id: business.id },
        data: { pricingPackageId: pricingPackage.id },
      });
    } else {
      return NextResponse.json({ ok: true, alreadyUpgraded: true });
    }

    const to =
      session.user.email ||
      checkoutSession.customer_details?.email ||
      checkoutSession.customer_email ||
      null;

    if (to) {
      const amountTotal = checkoutSession.amount_total ?? 0;
      if (amountTotal > 0) {
        try {
          const currency = (checkoutSession.currency || "gbp").toUpperCase();
          const amountFormatted = `${currency} ${(amountTotal / 100).toFixed(2)}`;
          await sendPaymentReceivedEmail({
            to,
            name: session.user.name || undefined,
            packageName: pricingPackage.name,
            amountFormatted,
            paymentMode: parsed.data.paymentMode,
          });
        } catch (paymentEmailError) {
          console.error("payment_received_email_error", paymentEmailError);
        }
      }

      try {
        await sendPlanUpgradedEmail({
          to,
          name: session.user.name || undefined,
          businessName: business.name,
          previousPackageName: business.pricingPackage?.name || null,
          newPackageName: pricingPackage.name,
        });
      } catch (upgradeEmailError) {
        console.error("plan_upgraded_email_error", upgradeEmailError);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("verify_upgrade_checkout_session_error", error);
    return NextResponse.json(
      { ok: false, error: "Failed to verify upgrade checkout session." },
      { status: 500 },
    );
  }
}
