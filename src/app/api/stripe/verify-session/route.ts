import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getStripeClient } from "@/lib/stripe";

const bodySchema = z.object({
  sessionId: z.string().trim().min(1),
  selectedPackage: z.string().trim().min(1),
  paymentMode: z.enum(["subscription", "one_time"]).optional().default("subscription"),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const stripe = getStripeClient();
    const checkoutSession = await stripe.checkout.sessions.retrieve(
      parsed.data.sessionId,
    );

    const isOwner = checkoutSession.metadata?.userId === session.user.id;
    const packageMatches =
      checkoutSession.metadata?.selectedPackage === parsed.data.selectedPackage;
    const completed = checkoutSession.status === "complete";
    const paymentModeMatches =
      (checkoutSession.metadata?.paymentMode || "subscription") ===
      parsed.data.paymentMode;
    const expectedMode =
      parsed.data.paymentMode === "one_time" ? "payment" : "subscription";
    const checkoutModeMatches = checkoutSession.mode === expectedMode;

    if (
      !isOwner ||
      !packageMatches ||
      !completed ||
      !paymentModeMatches ||
      !checkoutModeMatches
    ) {
      return NextResponse.json(
        { ok: false, error: "Payment verification failed." },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("verify_checkout_session_error", error);
    return NextResponse.json(
      { ok: false, error: "Failed to verify checkout session." },
      { status: 500 },
    );
  }
}
