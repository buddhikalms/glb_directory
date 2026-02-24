import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  buildEmailTemplatePreview,
  sendTemplateTestEmail,
  type EmailTemplateType,
} from "@/lib/auth-email";

const schema = z.object({
  type: z.enum([
    "verification",
    "welcome",
    "admin_alert",
    "listing_under_review",
    "payment_received",
    "listing_approved",
    "listing_rejected",
  ]),
  to: z.string().trim().email(),
  name: z.string().trim().max(120).optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  role: z.string().trim().max(64).optional().or(z.literal("")),
  provider: z.string().trim().max(64).optional().or(z.literal("")),
});

async function ensureAdmin() {
  const session = await auth();
  return Boolean(session?.user?.id && session.user.role === "admin");
}

export async function GET(request: Request) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = (searchParams.get("type") || "welcome") as EmailTemplateType;
  const to = searchParams.get("to") || "test@example.com";
  const name = searchParams.get("name") || "Test User";
  const email = searchParams.get("email") || to;
  const role = searchParams.get("role") || "guest";
  const provider = searchParams.get("provider") || "credentials";

  const parsed = schema.safeParse({ type, to, name, email, role, provider });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid preview payload." }, { status: 400 });
  }

  const content = buildEmailTemplatePreview({
    type: parsed.data.type,
    to: parsed.data.to,
    name: parsed.data.name || undefined,
    email: parsed.data.email || undefined,
    role: parsed.data.role || undefined,
    provider: parsed.data.provider || undefined,
  });

  return NextResponse.json({ ok: true, ...content });
}

export async function POST(request: Request) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const content = await sendTemplateTestEmail({
      type: parsed.data.type,
      to: parsed.data.to,
      name: parsed.data.name || undefined,
      email: parsed.data.email || undefined,
      role: parsed.data.role || undefined,
      provider: parsed.data.provider || undefined,
    });

    return NextResponse.json({
      ok: true,
      message: `Test email sent to ${parsed.data.to}.`,
      subject: content.subject,
    });
  } catch (error) {
    console.error("admin_email_test_error", error);
    return NextResponse.json({ error: "Failed to send test email." }, { status: 500 });
  }
}
