import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getBillingDurationDays } from "@/lib/pricing-duration";
import { getStripeClient } from "@/lib/stripe";

const bodySchema = z.object({
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

    const pricingPackage = await prisma.pricingPackage.findUnique({
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
    });

    if (!pricingPackage || !pricingPackage.active) {
      return NextResponse.json(
        { error: "Pricing package not found." },
        { status: 404 },
      );
    }

    if (pricingPackage.price <= 0) {
      return NextResponse.json({
        noPaymentRequired: true,
      });
    }

    const stripe = getStripeClient();
    const baseUrl = getBaseUrl(request);

    const commonParams = {
      success_url: `${baseUrl}/submit/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/submit?payment=cancelled`,
      customer_email: session.user.email || undefined,
      metadata: {
        userId: session.user.id,
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
                    name: pricingPackage.name,
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
                  // Stripe supports day intervals up to 365.
                  // We use exact configured durationDays for recurring plans.
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
                    name: pricingPackage.name,
                    description: pricingPackage.description,
                  },
                },
              },
            ],
            subscription_data: {
              metadata: {
                userId: session.user.id,
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
    console.error("create_checkout_session_error", error);
    return NextResponse.json(
      { error: "Failed to create checkout session." },
      { status: 500 },
    );
  }
}
