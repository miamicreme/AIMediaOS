import Stripe from "stripe";

const stripeApiKey = process.env.STRIPE_SECRET_KEY;

if (!stripeApiKey) {
  console.warn("STRIPE_SECRET_KEY not configured - Stripe features will be unavailable");
}

export const stripe = stripeApiKey ? new Stripe(stripeApiKey) : null;

export interface CheckoutSessionParams {
  userId: string;
  email: string;
  planId: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(params: CheckoutSessionParams) {
  if (!stripe) throw new Error("Stripe not configured");

  const planPrices: Record<string, string> = {
    "pro-monthly": process.env.STRIPE_PRICE_PRO_MONTHLY || "",
    "pro-annual": process.env.STRIPE_PRICE_PRO_ANNUAL || "",
  };

  const priceId = planPrices[params.planId];
  if (!priceId) throw new Error(`Invalid plan: ${params.planId}`);

  const session = await stripe.checkout.sessions.create({
    customer_email: params.email,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { userId: params.userId, planId: params.planId },
  });

  return session;
}

export async function handlePaymentSuccess(event: Stripe.Event) {
  if (event.type !== "checkout.session.completed") return;

  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId;
  const email = session.customer_email;

  if (!userId || !planId) {
    console.error("Missing userId or planId in session metadata");
    return;
  }

  const { supabase } = await import("./index");
  if (!supabase) throw new Error("Supabase not configured");

  await supabase.from("user_profiles").update({ stripe_customer_id: session.customer as string }).eq("id", userId);

  await supabase
    .from("subscription_history")
    .insert({
      user_id: userId,
      plan_id: planId,
      started_at: new Date().toISOString(),
    });

  await supabase.from("user_profiles").update({ subscription_tier: planId }).eq("id", userId);

  if (email && session.amount_total) {
    const { sendEmail, createPaymentSuccessEmail } = await import("./email");
    await sendEmail(createPaymentSuccessEmail(email, planId, session.amount_total));
  }
}

export async function handleSubscriptionCancelled(event: Stripe.Event) {
  if (event.type !== "customer.subscription.deleted") return;

  const subscription = event.data.object as Stripe.Subscription;
  const customerId = subscription.customer as string;

  if (!customerId) return;

  const { supabase } = await import("./index");
  if (!supabase) throw new Error("Supabase not configured");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id, email")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!profile) return;

  await supabase
    .from("subscription_history")
    .update({ ended_at: new Date().toISOString() })
    .eq("user_id", profile.id)
    .is("ended_at", null);

  await supabase.from("user_profiles").update({ subscription_tier: "free" }).eq("id", profile.id);

  if (profile.email) {
    const { sendEmail, createSubscriptionCancelledEmail } = await import("./email");
    await sendEmail(createSubscriptionCancelledEmail(profile.email));
  }
}

export function verifyWebhookSignature(payload: string, signature: string, secret: string): Stripe.Event | null {
  if (!stripe) return null;

  try {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return null;
  }
}
