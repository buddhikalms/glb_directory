import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStripeClient } from "@/lib/stripe";

type SubscriptionRow = {
  subscriptionId: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: number | null;
  createdAt: string;
  customerEmail: string | null;
  selectedPackage: string | null;
  amountTotal: number;
  currency: string;
  checkoutSessionId: string;
};

function getCurrentPeriodEnd(subscription: unknown): number | null {
  const value = (subscription as { current_period_end?: unknown })
    ?.current_period_end;
  return typeof value === "number" ? value : null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "business_owner" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const stripe = getStripeClient();
    const checkoutSessions = await stripe.checkout.sessions.list({ limit: 100 });

    const ownedSessions = checkoutSessions.data.filter((item) => {
      const paymentMode =
        item.metadata?.paymentMode === "one_time" ? "one_time" : "subscription";
      if (paymentMode !== "subscription") return false;
      if (!item.subscription || typeof item.subscription !== "string") return false;

      const metadataUserId = item.metadata?.userId;
      const sessionEmail = item.customer_details?.email || item.customer_email;

      return (
        metadataUserId === session.user.id ||
        (!!session.user.email && sessionEmail === session.user.email)
      );
    });

    const uniqueSubscriptionIds = Array.from(
      new Set(
        ownedSessions
          .map((item) =>
            typeof item.subscription === "string" ? item.subscription : null,
          )
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const subscriptions = await Promise.all(
      uniqueSubscriptionIds.map((id) => stripe.subscriptions.retrieve(id)),
    );
    const subscriptionMap = new Map(subscriptions.map((item) => [item.id, item]));

    const rows: SubscriptionRow[] = ownedSessions
      .flatMap((item) => {
        const subscriptionId =
          typeof item.subscription === "string" ? item.subscription : null;
        if (!subscriptionId) return [];

        const subscription = subscriptionMap.get(subscriptionId);
        if (!subscription) return [];

        return [{
          subscriptionId,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: getCurrentPeriodEnd(subscription),
          createdAt: new Date(item.created * 1000).toISOString(),
          customerEmail: item.customer_details?.email || item.customer_email || null,
          selectedPackage: item.metadata?.selectedPackage || null,
          amountTotal: item.amount_total ?? 0,
          currency: item.currency || "gbp",
          checkoutSessionId: item.id,
        }];
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    return NextResponse.json({ subscriptions: rows });
  } catch (error) {
    console.error("my_subscriptions_error", error);
    return NextResponse.json(
      { error: "Failed to load subscriptions." },
      { status: 500 },
    );
  }
}
