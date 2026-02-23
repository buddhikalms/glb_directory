import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getStripeClient } from "@/lib/stripe";

const bodySchema = z.object({
  subscriptionId: z.string().trim().min(1),
});

function isAdmin(role: string | undefined) {
  return role === "admin";
}

function getCurrentPeriodEnd(subscription: unknown): number | null {
  const value = (subscription as { current_period_end?: unknown })
    ?.current_period_end;
  return typeof value === "number" ? value : null;
}

async function canManageSubscription(
  subscriptionId: string,
  userId: string,
  userEmail: string | null | undefined,
) {
  const stripe = getStripeClient();

  const sessions = await stripe.checkout.sessions.list({
    subscription: subscriptionId,
    limit: 10,
  });

  const matchingSession = sessions.data.find((item) => {
    const metadataUserId = item.metadata?.userId;
    const sessionEmail = item.customer_details?.email || item.customer_email;
    return metadataUserId === userId || (!!userEmail && sessionEmail === userEmail);
  });

  return Boolean(matchingSession);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin(session.user.role) && session.user.role !== "business_owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const stripe = getStripeClient();
    const subscription = await stripe.subscriptions.retrieve(
      parsed.data.subscriptionId,
    );

    if (!isAdmin(session.user.role)) {
      const allowed = await canManageSubscription(
        subscription.id,
        session.user.id,
        session.user.email,
      );

      if (!allowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const alreadyCanceled =
      subscription.status === "canceled" || subscription.cancel_at_period_end;
    if (alreadyCanceled) {
      return NextResponse.json({
        ok: true,
        subscriptionId: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: getCurrentPeriodEnd(subscription),
        message: "Subscription already cancelled.",
      });
    }

    const updated = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({
      ok: true,
      subscriptionId: updated.id,
      status: updated.status,
      cancelAtPeriodEnd: updated.cancel_at_period_end,
      currentPeriodEnd: getCurrentPeriodEnd(updated),
      message: "Subscription cancellation scheduled.",
    });
  } catch (error) {
    console.error("cancel_subscription_error", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription." },
      { status: 500 },
    );
  }
}
