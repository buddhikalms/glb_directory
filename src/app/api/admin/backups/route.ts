import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listBackups, runBackup } from "@/lib/backup-system";

export const runtime = "nodejs";

function toUnauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return toUnauthorized();
  }

  try {
    const backups = await listBackups();
    return NextResponse.json({ backups });
  } catch (error) {
    console.error("admin_backups_list_error", error);
    return NextResponse.json(
      { error: "Failed to list backups." },
      { status: 500 },
    );
  }
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return toUnauthorized();
  }

  try {
    const result = await runBackup();
    return NextResponse.json(result);
  } catch (error) {
    console.error("admin_backups_run_error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create backup.",
      },
      { status: 500 },
    );
  }
}
