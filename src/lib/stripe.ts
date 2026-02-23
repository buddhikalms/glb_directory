import Stripe from "stripe";

declare global {
  var __stripeClient: Stripe | undefined;
}

function getSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return key;
}

export function getStripeClient() {
  if (!global.__stripeClient) {
    global.__stripeClient = new Stripe(getSecretKey());
  }

  return global.__stripeClient;
}
