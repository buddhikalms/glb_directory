import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { sendPlanUpgradedEmail } from "@/lib/auth-email";
import { executePlanDowngrade } from "@/lib/downgrade-execution";
import {
  createOrUpdatePendingDowngradeRequest,
  getDowngradeDecisionMode,
} from "@/lib/downgrade-policy-store";
import { prisma } from "@/lib/prisma";
import { getBillingDurationDays } from "@/lib/pricing-duration";
import { getStripeClient } from "@/lib/stripe";

const bodySchema = z.object({
  businessId: z.string().trim().min(1),
  selectedPackage: z.string().trim().min(1),
  paymentMode: z.enum(["subscription", "one_time"]).optional().default("subscription"),
});

function getBaseUrl(request: Request) {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  return new URL(request.url).origin;
}

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

    const [business, pricingPackage] = await Promise.all([
      prisma.business.findFirst({
        where: { id: parsed.data.businessId, ownerId: session.user.id },
        select: {
          id: true,
          name: true,
          pricingPackageId: true,
          pricingPackage: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
        },
      }),
      prisma.pricingPackage.findUnique({
        where: { id: parsed.data.selectedPackage },
        select: {
          id: true,
          name: true,
          description: true,
          active: true,
          price: true,
          billingPeriod: true,
          durationDays: true,
        },
      }),
    ]);

    if (!business) {
      return NextResponse.json(
        { error: "Listing not found or not owned by current user." },
        { status: 404 },
      );
    }

    if (!pricingPackage || !pricingPackage.active) {
      return NextResponse.json(
        { error: "Pricing package not found." },
        { status: 404 },
      );
    }

    if (business.pricingPackageId === pricingPackage.id) {
      return NextResponse.json(
        { error: "This listing is already on the selected plan." },
        { status: 400 },
      );
    }

    const currentPackagePrice = Number(business.pricingPackage?.price || 0);
    const isDowngrade =
      Boolean(business.pricingPackageId) &&
      pricingPackage.price < currentPackagePrice;

    if (isDowngrade) {
      if (pricingPackage.price <= 0) {
        return NextResponse.json(
          { error: "Downgrading to a free plan is not allowed." },
          { status: 400 },
        );
      }

      const downgradeMode = await getDowngradeDecisionMode();
      if (downgradeMode === "admin_approval") {
        const request = await createOrUpdatePendingDowngradeRequest({
          ownerUserId: session.user.id,
          ownerEmail: session.user.email || null,
          ownerName: session.user.name || null,
          businessId: business.id,
          businessName: business.name,
          currentPackageId: business.pricingPackageId || "",
          currentPackageName: business.pricingPackage?.name || "Current plan",
          targetPackageId: pricingPackage.id,
          targetPackageName: pricingPackage.name,
        });

        return NextResponse.json({
          ok: true,
          downgradeRequested: true,
          requiresAdminApproval: true,
          requestId: request.id,
          message:
            "Downgrade request submitted. An admin will review your request before changing your plan.",
        });
      }

      const downgraded = await executePlanDowngrade({
        ownerUserId: session.user.id,
        ownerEmail: session.user.email || null,
        businessId: business.id,
        currentPackageId: business.pricingPackageId,
        targetPackageId: pricingPackage.id,
      });

      return NextResponse.json({
        ok: true,
        noPaymentRequired: true,
        downgraded: true,
        cancelledSubscriptionCount: downgraded.cancelledSubscriptionIds.length,
        message:
          "Plan downgraded successfully. Your previous plan features are now disabled and only the selected plan features remain active.",
      });
    }

    // Free plans are applied immediately without checkout.
    if (pricingPackage.price <= 0) {
      await prisma.business.update({
        where: { id: business.id },
        data: { pricingPackageId: pricingPackage.id },
      });

      const recipientEmail = session.user.email;
      if (recipientEmail) {
        try {
          await sendPlanUpgradedEmail({
            to: recipientEmail,
            name: session.user.name || undefined,
            businessName: business.name,
            newPackageName: pricingPackage.name,
            previousPackageName: business.pricingPackage?.name || null,
          });
        } catch (emailError) {
          console.error("plan_upgrade_email_error", emailError);
        }
      }

      return NextResponse.json({
        ok: true,
        upgraded: true,
        noPaymentRequired: true,
        message: "Plan upgraded successfully.",
      });
    }

    const stripe = getStripeClient();
    const baseUrl = getBaseUrl(request);
    const successUrl =
      `${baseUrl}/dashboard/billing` +
      `?upgradeSessionId={CHECKOUT_SESSION_ID}` +
      `&businessId=${encodeURIComponent(business.id)}` +
      `&selectedPackage=${encodeURIComponent(pricingPackage.id)}` +
      `&paymentMode=${encodeURIComponent(parsed.data.paymentMode)}`;
    const cancelUrl =
      `${baseUrl}/dashboard/billing` +
      `?upgrade=cancelled` +
      `&businessId=${encodeURIComponent(business.id)}`;

    const commonParams = {
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: session.user.email || undefined,
      metadata: {
        flow: "plan_upgrade",
        userId: session.user.id,
        businessId: business.id,
        selectedPackage: pricingPackage.id,
        paymentMode: parsed.data.paymentMode,
      },
      allow_promotion_codes: true,
    };

    const checkoutSession =
      parsed.data.paymentMode === "one_time"
        ? await stripe.checkout.sessions.create({
            ...commonParams,
            mode: "payment",
            line_items: [
              {
                quantity: 1,
                price_data: {
                  currency: "gbp",
                  unit_amount: Math.round(pricingPackage.price * 100),
                  product_data: {
                    name: `${pricingPackage.name} - Plan Upgrade`,
                    description: pricingPackage.description,
                  },
                },
              },
            ],
          })
        : await stripe.checkout.sessions.create({
            ...commonParams,
            mode: "subscription",
            line_items: [
              {
                quantity: 1,
                price_data: {
                  currency: "gbp",
                  unit_amount: Math.round(pricingPackage.price * 100),
                  recurring: {
                    interval: "day",
                    interval_count: Math.max(
                      1,
                      Math.min(
                        365,
                        getBillingDurationDays(
                          pricingPackage.billingPeriod,
                          pricingPackage.durationDays,
                        ),
                      ),
                    ),
                  },
                  product_data: {
                    name: `${pricingPackage.name} - Plan Upgrade`,
                    description: pricingPackage.description,
                  },
                },
              },
            ],
            subscription_data: {
              metadata: {
                flow: "plan_upgrade",
                userId: session.user.id,
                businessId: business.id,
                selectedPackage: pricingPackage.id,
                paymentMode: parsed.data.paymentMode,
              },
            },
          });

    if (!checkoutSession.url) {
      return NextResponse.json(
        { error: "Failed to create checkout URL." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error("create_upgrade_checkout_session_error", error);
    return NextResponse.json(
      { error: "Failed to create upgrade checkout session." },
      { status: 500 },
    );
  }
}
