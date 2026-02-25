type JsonRecord = Record<string, unknown>;

function toRecord(value: unknown): JsonRecord {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonRecord;
  }
  return {};
}

function toSafeInt(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return Math.floor(numeric);
}

export function getBusinessClicks(contact: unknown): number {
  const contactRecord = toRecord(contact);
  const analytics = toRecord(contactRecord.analytics);
  return toSafeInt(analytics.clicks);
}

export function withIncrementedBusinessClicks(
  contact: unknown,
  incrementBy = 1,
): JsonRecord {
  const contactRecord = toRecord(contact);
  const analytics = toRecord(contactRecord.analytics);
  const nextClicks = getBusinessClicks(contactRecord) + toSafeInt(incrementBy);

  return {
    ...contactRecord,
    analytics: {
      ...analytics,
      clicks: nextClicks,
    },
  };
}
