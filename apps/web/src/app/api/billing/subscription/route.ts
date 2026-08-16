import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@aimediaos/db/stripe";
import { requireAuth } from "../../middleware/auth";
import { supabase } from "@aimediaos/db";

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status });
}

export async function GET(request: NextRequest) {
  const { context: authContext, response: authError } = await requireAuth(request);
  if (authError) return authError;

  if (!supabase) return json(500, { error: "Database not configured" });

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("subscription_tier, stripe_customer_id")
    .eq("id", authContext!.userId)
    .single();

  if (!profile) return json(404, { error: "Profile not found" });

  return json(200, {
    tier: profile.subscription_tier,
    customerId: profile.stripe_customer_id,
  });
}

export async function PUT(request: NextRequest) {
  const { context: authContext, response: authError } = await requireAuth(request);
  if (authError) return authError;

  if (!stripe || !supabase) return json(500, { error: "Services not configured" });

  let body: { action: string };

  try {
    body = (await request.json()) as { action: string };
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  if (!["cancel"].includes(body.action)) {
    return json(400, { error: "Invalid action" });
  }

  try {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("stripe_customer_id")
      .eq("id", authContext!.userId)
      .single();

    if (!profile?.stripe_customer_id) {
      return json(400, { error: "No active subscription" });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: "active",
      limit: 1,
    });

    if (!subscriptions.data.length) {
      return json(400, { error: "No active subscription" });
    }

    await stripe.subscriptions.cancel(subscriptions.data[0].id);

    return json(200, { message: "Subscription cancelled" });
  } catch (error) {
    console.error("Subscription update error:", error);
    return json(500, { error: "Failed to update subscription" });
  }
}
