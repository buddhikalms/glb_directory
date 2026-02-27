import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";

type ExecuteDowngradeInput = {
  ownerUserId: string;
  ownerEmail?: string | null;
  businessId: string;
  currentPackageId?: string | null;
  targetPackageId: string;
};

export type ExecuteDowngradeResult = {
  businessId: string;
  cancelledSubscriptionIds: string[];
};

function isSubscriptionCheckoutSession(
  item: Record<string, unknown>,
) {
  if (typeof item.subscription !== "string" || !item.subscription) return false;
  const paymentMode =
    item?.metadata &&
    typeof item.metadata === "object" &&
    (item.metadata as Record<string, unknown>).paymentMode === "one_time"
      ? "one_time"
      : "subscription";
  return paymentMode === "subscription";
}

function isOwnedSession(
  item: Record<string, unknown>,
  ownerUserId: string,
  ownerEmail?: string | null,
) {
  const metadata =
    item.metadata && typeof item.metadata === "object"
      ? (item.metadata as Record<string, unknown>)
      : {};
  const metadataUserId =
    typeof metadata.userId === "string" ? metadata.userId : null;
  const sessionEmail =
    (item.customer_details &&
    typeof item.customer_details === "object" &&
    typeof (item.customer_details as Record<string, unknown>).email === "string"
      ? (item.customer_details as Record<string, unknown>).email
      : null) ||
    (typeof item.customer_email === "string" ? item.customer_email : null);

  return (
    metadataUserId === ownerUserId ||
    (!!ownerEmail && sessionEmail === ownerEmail)
  );
}

function getMetadataString(
  item: Record<string, unknown>,
  key: string,
) {
  const metadata =
    item.metadata && typeof item.metadata === "object"
      ? (item.metadata as Record<string, unknown>)
      : {};
  const value = metadata[key];
  return typeof value === "string" ? value : null;
}

async function findSubscriptionIdsForDowngrade({
  ownerUserId,
  ownerEmail,
  businessId,
  currentPackageId,
}: Omit<ExecuteDowngradeInput, "targetPackageId">) {
  const stripe = getStripeClient();
  const sessions = await stripe.checkout.sessions.list({ limit: 100 });

  const ownedSessions = sessions.data.filter(
    (item) =>
      isSubscriptionCheckoutSession(item as unknown as Record<string, unknown>) &&
      isOwnedSession(
        item as unknown as Record<string, unknown>,
        ownerUserId,
        ownerEmail,
      ),
  );

  const businessMatched = ownedSessions.filter(
    (item) =>
      getMetadataString(
        item as unknown as Record<string, unknown>,
        "businessId",
      ) === businessId,
  );

  const fallbackMatched =
    businessMatched.length > 0 || !currentPackageId
      ? []
      : ownedSessions.filter(
          (item) =>
            getMetadataString(
              item as unknown as Record<string, unknown>,
              "selectedPackage",
            ) === currentPackageId,
        );

  const candidateSessions =
    businessMatched.length > 0 ? businessMatched : fallbackMatched;

  return Array.from(
    new Set(
      candidateSessions
        .map((item) =>
          typeof item.subscription === "string" ? item.subscription : null,
        )
        .filter((item): item is string => Boolean(item)),
    ),
  );
}

async function cancelSubscriptions(subscriptionIds: string[]) {
  if (subscriptionIds.length === 0) return [];

  const stripe = getStripeClient();
  const cancelled: string[] = [];

  for (const subscriptionId of subscriptionIds) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (subscription.status === "canceled") continue;

    await stripe.subscriptions.cancel(subscriptionId);
    cancelled.push(subscriptionId);
  }

  return cancelled;
}

export async function executePlanDowngrade(
  input: ExecuteDowngradeInput,
): Promise<ExecuteDowngradeResult> {
  const subscriptionIds = await findSubscriptionIdsForDowngrade({
    ownerUserId: input.ownerUserId,
    ownerEmail: input.ownerEmail,
    businessId: input.businessId,
    currentPackageId: input.currentPackageId,
  });

  const cancelledSubscriptionIds = await cancelSubscriptions(subscriptionIds);

  await prisma.business.update({
    where: { id: input.businessId },
    data: { pricingPackageId: input.targetPackageId },
  });

  return {
    businessId: input.businessId,
    cancelledSubscriptionIds,
  };
}
