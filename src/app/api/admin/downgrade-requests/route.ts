import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  listDowngradeRequests,
  type DowngradeRequestStatus,
} from "@/lib/downgrade-policy-store";

function isAdmin(role: string | undefined) {
  return role === "admin";
}

function parseStatus(value: string | null): DowngradeRequestStatus | undefined {
  if (value === "pending" || value === "approved" || value === "rejected") {
    return value;
  }
  return undefined;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const status = parseStatus(url.searchParams.get("status"));
    const requests = await listDowngradeRequests(status);
    return NextResponse.json({ requests });
  } catch (error) {
    console.error("list_downgrade_requests_error", error);
    return NextResponse.json(
      { error: "Failed to load downgrade requests." },
      { status: 500 },
    );
  }
}
