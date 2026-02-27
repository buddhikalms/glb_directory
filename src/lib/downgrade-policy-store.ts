import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

export type DowngradeDecisionMode = "auto" | "admin_approval";
export type DowngradeRequestStatus = "pending" | "approved" | "rejected";

export type DowngradeRequestRecord = {
  id: string;
  ownerUserId: string;
  ownerEmail: string | null;
  ownerName: string | null;
  businessId: string;
  businessName: string;
  currentPackageId: string;
  currentPackageName: string;
  targetPackageId: string;
  targetPackageName: string;
  status: DowngradeRequestStatus;
  createdAt: string;
  updatedAt: string;
  decidedAt: string | null;
  decidedByUserId: string | null;
  decidedByName: string | null;
};

type DowngradePolicyState = {
  mode: DowngradeDecisionMode;
  expiredListingPackageId: string | null;
  requests: DowngradeRequestRecord[];
};

export type CreateDowngradeRequestInput = {
  ownerUserId: string;
  ownerEmail?: string | null;
  ownerName?: string | null;
  businessId: string;
  businessName: string;
  currentPackageId: string;
  currentPackageName: string;
  targetPackageId: string;
  targetPackageName: string;
};

export type DecideDowngradeRequestInput = {
  id: string;
  decision: Exclude<DowngradeRequestStatus, "pending">;
  decidedByUserId: string;
  decidedByName?: string | null;
};

const STORAGE_FILE_PATH = path.join(
  process.cwd(),
  "storage",
  "downgrade-policy.json",
);

const DEFAULT_STATE: DowngradePolicyState = {
  mode: "auto",
  expiredListingPackageId: null,
  requests: [],
};

function normalizeMode(value: unknown): DowngradeDecisionMode {
  return value === "admin_approval" ? "admin_approval" : "auto";
}

function normalizeStatus(value: unknown): DowngradeRequestStatus {
  if (value === "approved" || value === "rejected") return value;
  return "pending";
}

function toSafeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toSafeNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeRequest(value: unknown): DowngradeRequestRecord | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;

  const id = toSafeString(raw.id);
  const ownerUserId = toSafeString(raw.ownerUserId);
  const businessId = toSafeString(raw.businessId);
  const businessName = toSafeString(raw.businessName);
  const currentPackageId = toSafeString(raw.currentPackageId);
  const currentPackageName = toSafeString(raw.currentPackageName);
  const targetPackageId = toSafeString(raw.targetPackageId);
  const targetPackageName = toSafeString(raw.targetPackageName);
  const createdAt = toSafeString(raw.createdAt);
  const updatedAt = toSafeString(raw.updatedAt);

  if (
    !id ||
    !ownerUserId ||
    !businessId ||
    !businessName ||
    !currentPackageId ||
    !currentPackageName ||
    !targetPackageId ||
    !targetPackageName ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }

  return {
    id,
    ownerUserId,
    ownerEmail: toSafeNullableString(raw.ownerEmail),
    ownerName: toSafeNullableString(raw.ownerName),
    businessId,
    businessName,
    currentPackageId,
    currentPackageName,
    targetPackageId,
    targetPackageName,
    status: normalizeStatus(raw.status),
    createdAt,
    updatedAt,
    decidedAt: toSafeNullableString(raw.decidedAt),
    decidedByUserId: toSafeNullableString(raw.decidedByUserId),
    decidedByName: toSafeNullableString(raw.decidedByName),
  };
}

async function ensureStorageFile() {
  const dir = path.dirname(STORAGE_FILE_PATH);
  await fs.mkdir(dir, { recursive: true });

  try {
    await fs.access(STORAGE_FILE_PATH);
  } catch {
    await fs.writeFile(
      STORAGE_FILE_PATH,
      `${JSON.stringify(DEFAULT_STATE, null, 2)}\n`,
      "utf-8",
    );
  }
}

async function readState(): Promise<DowngradePolicyState> {
  await ensureStorageFile();

  try {
    const raw = await fs.readFile(STORAGE_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    const mode = normalizeMode(parsed.mode);
    const expiredListingPackageId = toSafeNullableString(
      parsed.expiredListingPackageId,
    );
    const requests = Array.isArray(parsed.requests)
      ? parsed.requests
          .map((item) => normalizeRequest(item))
          .filter((item): item is DowngradeRequestRecord => Boolean(item))
      : [];

    return {
      mode,
      expiredListingPackageId,
      requests,
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

async function writeState(state: DowngradePolicyState) {
  await ensureStorageFile();
  await fs.writeFile(
    STORAGE_FILE_PATH,
    `${JSON.stringify(state, null, 2)}\n`,
    "utf-8",
  );
}

export async function getDowngradeDecisionMode() {
  const state = await readState();
  return state.mode;
}

export async function setDowngradeDecisionMode(mode: DowngradeDecisionMode) {
  const state = await readState();
  const nextState: DowngradePolicyState = {
    ...state,
    mode: normalizeMode(mode),
  };
  await writeState(nextState);
  return nextState.mode;
}

export async function getExpiredListingPackageId() {
  const state = await readState();
  const fromStore = state.expiredListingPackageId;
  if (fromStore) return fromStore;

  const fromEnv = toSafeNullableString(process.env.EXPIRED_LISTING_PACKAGE_ID);
  return fromEnv;
}

export async function setExpiredListingPackageId(
  packageId: string | null | undefined,
) {
  const state = await readState();
  const nextState: DowngradePolicyState = {
    ...state,
    expiredListingPackageId: toSafeNullableString(packageId),
  };
  await writeState(nextState);
  return nextState.expiredListingPackageId;
}

export async function listDowngradeRequests(
  status?: DowngradeRequestStatus,
) {
  const state = await readState();
  const filtered = status
    ? state.requests.filter((item) => item.status === status)
    : state.requests;

  return filtered.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getDowngradeRequestById(id: string) {
  const state = await readState();
  return state.requests.find((item) => item.id === id) || null;
}

export async function createOrUpdatePendingDowngradeRequest(
  input: CreateDowngradeRequestInput,
) {
  const state = await readState();
  const now = new Date().toISOString();

  const existing = state.requests.find(
    (item) =>
      item.status === "pending" &&
      item.ownerUserId === input.ownerUserId &&
      item.businessId === input.businessId,
  );

  if (existing) {
    const updated: DowngradeRequestRecord = {
      ...existing,
      ownerEmail: input.ownerEmail || null,
      ownerName: input.ownerName || null,
      businessName: input.businessName,
      currentPackageId: input.currentPackageId,
      currentPackageName: input.currentPackageName,
      targetPackageId: input.targetPackageId,
      targetPackageName: input.targetPackageName,
      updatedAt: now,
      decidedAt: null,
      decidedByUserId: null,
      decidedByName: null,
    };

    const nextState: DowngradePolicyState = {
      ...state,
      requests: state.requests.map((item) =>
        item.id === existing.id ? updated : item,
      ),
    };
    await writeState(nextState);
    return updated;
  }

  const created: DowngradeRequestRecord = {
    id: randomUUID(),
    ownerUserId: input.ownerUserId,
    ownerEmail: input.ownerEmail || null,
    ownerName: input.ownerName || null,
    businessId: input.businessId,
    businessName: input.businessName,
    currentPackageId: input.currentPackageId,
    currentPackageName: input.currentPackageName,
    targetPackageId: input.targetPackageId,
    targetPackageName: input.targetPackageName,
    status: "pending",
    createdAt: now,
    updatedAt: now,
    decidedAt: null,
    decidedByUserId: null,
    decidedByName: null,
  };

  const nextState: DowngradePolicyState = {
    ...state,
    requests: [created, ...state.requests],
  };
  await writeState(nextState);
  return created;
}

export async function decideDowngradeRequest(input: DecideDowngradeRequestInput) {
  const state = await readState();
  const current = state.requests.find((item) => item.id === input.id) || null;

  if (!current) return null;
  if (current.status !== "pending") return current;

  const now = new Date().toISOString();
  const updated: DowngradeRequestRecord = {
    ...current,
    status: input.decision,
    updatedAt: now,
    decidedAt: now,
    decidedByUserId: input.decidedByUserId,
    decidedByName: input.decidedByName || null,
  };

  const nextState: DowngradePolicyState = {
    ...state,
    requests: state.requests.map((item) =>
      item.id === input.id ? updated : item,
    ),
  };
  await writeState(nextState);
  return updated;
}
