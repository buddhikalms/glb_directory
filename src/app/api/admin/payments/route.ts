import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStripeClient } from "@/lib/stripe";

type PaymentMode = "subscription" | "one_time";

type PaymentRow = {
  sessionId: string;
  createdAt: string;
  amountTotal: number;
  currency: string;
  status: string | null;
  paymentStatus: string | null;
  customerEmail: string | null;
  userId: string | null;
  selectedPackage: string | null;
  paymentMode: PaymentMode;
  stripeMode: string;
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  subscriptionCancelAtPeriodEnd: boolean | null;
  subscriptionCurrentPeriodEnd: number | null;
  canCancelSubscription: boolean;
};

function getCurrentPeriodEnd(subscription: unknown): number | null {
  const value = (subscription as { current_period_end?: unknown })
    ?.current_period_end;
  return typeof value === "number" ? value : null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stripe = getStripeClient();
    const checkoutSessions = await stripe.checkout.sessions.list({
      limit: 100,
    });

    const subscriptionIds = checkoutSessions.data
      .map((item) =>
        typeof item.subscription === "string" ? item.subscription : null,
      )
      .filter((id): id is string => Boolean(id));

    const subscriptionMap = new Map<
      string,
      {
        status: string;
        cancelAtPeriodEnd: boolean;
        currentPeriodEnd: number | null;
      }
    >();
    if (subscriptionIds.length > 0) {
      const uniqueSubscriptionIds = Array.from(new Set(subscriptionIds));
      const subscriptions = await Promise.all(
        uniqueSubscriptionIds.map((id) => stripe.subscriptions.retrieve(id)),
      );
      for (const subscription of subscriptions) {
        subscriptionMap.set(subscription.id, {
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: getCurrentPeriodEnd(subscription),
        });
      }
    }

    const rows: PaymentRow[] = checkoutSessions.data
      .map((item) => {
        const paymentMode: PaymentMode =
          item.metadata?.paymentMode === "one_time"
            ? "one_time"
            : "subscription";
        const subscriptionId =
          typeof item.subscription === "string" ? item.subscription : null;
        const subscriptionMeta = subscriptionId
          ? subscriptionMap.get(subscriptionId) || null
          : null;
        const canCancelSubscription = Boolean(
          subscriptionId &&
            subscriptionMeta &&
            subscriptionMeta.status !== "canceled" &&
            !subscriptionMeta.cancelAtPeriodEnd,
        );

        return {
          sessionId: item.id,
          createdAt: new Date(item.created * 1000).toISOString(),
          amountTotal: item.amount_total ?? 0,
          currency: item.currency || "gbp",
          status: item.status,
          paymentStatus: item.payment_status,
          customerEmail: item.customer_details?.email || item.customer_email || null,
          userId: item.metadata?.userId || null,
          selectedPackage: item.metadata?.selectedPackage || null,
          paymentMode,
          stripeMode: item.mode,
          subscriptionId,
          subscriptionStatus: subscriptionMeta?.status || null,
          subscriptionCancelAtPeriodEnd:
            subscriptionMeta?.cancelAtPeriodEnd ?? null,
          subscriptionCurrentPeriodEnd:
            subscriptionMeta?.currentPeriodEnd ?? null,
          canCancelSubscription,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    const subscriptions = rows.filter((item) => item.paymentMode === "subscription");
    const oneTimePayments = rows.filter((item) => item.paymentMode === "one_time");
    const paidRows = rows.filter((item) => item.paymentStatus === "paid");

    return NextResponse.json({
      summary: {
        total: rows.length,
        subscriptions: subscriptions.length,
        oneTimePayments: oneTimePayments.length,
        paidCount: paidRows.length,
        paidAmountTotal: paidRows.reduce((sum, item) => sum + item.amountTotal, 0),
      },
      subscriptions,
      oneTimePayments,
      all: rows,
    });
  } catch (error) {
    console.error("admin_payments_error", error);
    return NextResponse.json(
      { error: "Failed to load payments." },
      { status: 500 },
    );
  }
}
