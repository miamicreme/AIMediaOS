import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@aimediaos/db/stripe";
import { requireAuth } from "../../middleware/auth";

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status });
}

export async function POST(request: NextRequest) {
  const { context: authContext, response: authError } = await requireAuth(request);
  if (authError) return authError;

  let body: { planId: string };

  try {
    body = (await request.json()) as { planId: string };
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  if (!body.planId || !["pro-monthly", "pro-annual"].includes(body.planId)) {
    return json(400, { error: "Invalid plan ID" });
  }

  try {
    const baseUrl = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const session = await createCheckoutSession({
      userId: authContext!.userId,
      email: authContext!.email,
      planId: body.planId,
      successUrl: `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/pricing`,
    });

    return json(200, { sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return json(500, { error: "Failed to create checkout session" });
  }
}
