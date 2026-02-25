export type PricingBillingPeriod = "monthly" | "yearly";

export function getBillingDurationDays(
  billingPeriod?: PricingBillingPeriod,
  durationDays?: number,
): number {
  if (
    typeof durationDays === "number" &&
    Number.isFinite(durationDays) &&
    durationDays > 0
  ) {
    return Math.floor(durationDays);
  }
  if (!billingPeriod) return 0;
  return billingPeriod === "yearly" ? 365 : 30;
}

export function getBillingDurationLabel(
  billingPeriod?: PricingBillingPeriod,
  durationDays?: number,
): string {
  const days = getBillingDurationDays(billingPeriod, durationDays);
  return days > 0 ? `${days} days` : "";
}

export function addBillingDuration(
  startDate: Date,
  billingPeriod?: PricingBillingPeriod,
  durationDays?: number,
): Date {
  const days = getBillingDurationDays(billingPeriod, durationDays);
  const nextDate = new Date(startDate);
  if (days > 0) {
    nextDate.setDate(nextDate.getDate() + days);
  }
  return nextDate;
}

export function getBillingPeriodFromDurationDays(
  durationDays?: number,
): PricingBillingPeriod {
  const days = getBillingDurationDays(undefined, durationDays);
  return days >= 365 ? "yearly" : "monthly";
}
