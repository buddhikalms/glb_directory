import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  getDowngradeDecisionMode,
  getExpiredListingPackageId,
  setExpiredListingPackageId,
  setDowngradeDecisionMode,
} from "@/lib/downgrade-policy-store";

const bodySchema = z
  .object({
    mode: z.enum(["auto", "admin_approval"]).optional(),
    expiredListingPackageId: z
      .string()
      .trim()
      .min(1)
      .nullable()
      .optional(),
  })
  .refine(
    (value) =>
      Object.prototype.hasOwnProperty.call(value, "mode") ||
      Object.prototype.hasOwnProperty.call(value, "expiredListingPackageId"),
    {
      message: "At least one field is required.",
    },
  );

function isAdmin(role: string | undefined) {
  return role === "admin";
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [mode, expiredListingPackageId] = await Promise.all([
      getDowngradeDecisionMode(),
      getExpiredListingPackageId(),
    ]);
    return NextResponse.json({ mode, expiredListingPackageId });
  } catch (error) {
    console.error("get_downgrade_policy_error", error);
    return NextResponse.json(
      { error: "Failed to load downgrade policy." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    let mode = await getDowngradeDecisionMode();
    if (parsed.data.mode === "auto" || parsed.data.mode === "admin_approval") {
      mode = await setDowngradeDecisionMode(parsed.data.mode);
    }

    let expiredListingPackageId = await getExpiredListingPackageId();
    if (
      Object.prototype.hasOwnProperty.call(parsed.data, "expiredListingPackageId")
    ) {
      expiredListingPackageId = await setExpiredListingPackageId(
        parsed.data.expiredListingPackageId ?? null,
      );
    }

    return NextResponse.json({ ok: true, mode, expiredListingPackageId });
  } catch (error) {
    console.error("update_downgrade_policy_error", error);
    return NextResponse.json(
      { error: "Failed to update downgrade policy." },
      { status: 500 },
    );
  }
}
