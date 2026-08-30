import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../middleware/auth";
import { createCheckoutSession } from "@aimediaos/db/stripe";

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status });
}

interface CreditPackage {
  id: string;
  credits: number;
  price: number;
}

const creditPackages: Record<string, CreditPackage> = {
  "starter": { id: "starter", credits: 50, price: 4_99 },
  "standard": { id: "standard", credits: 150, price: 12_99 },
  "professional": { id: "professional", credits: 500, price: 39_99 },
  "enterprise": { id: "enterprise", credits: 2000, price: 129_99 },
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { context: authContext, response: authError } = await requireAuth(request);
  if (authError) return authError;

  let body: { packageId: string };

  try {
    body = (await request.json()) as { packageId: string };
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  if (!body.packageId || !creditPackages[body.packageId]) {
    return json(400, {
      error: "Invalid package ID",
      validPackages: Object.keys(creditPackages),
    });
  }

  const pkg = creditPackages[body.packageId];

  try {
    const baseUrl = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await createCheckoutSession({
      userId: authContext!.userId,
      email: authContext!.email,
      planId: `credits-${body.packageId}`,
      successUrl: `${baseUrl}/dashboard?credits=purchased`,
      cancelUrl: `${baseUrl}/dashboard`,
    });

    if (!session.url) {
      console.error("Stripe session created without redirect URL");
      return json(500, { error: "Failed to generate checkout URL" });
    }

    return json(200, {
      sessionId: session.id,
      url: session.url,
      credits: pkg.credits,
      price: pkg.price,
    });
  } catch (error) {
    console.error("Credits purchase error:", error);
    return json(500, { error: "Failed to create purchase session" });
  }
}

export async function GET(): Promise<NextResponse> {
  return json(200, {
    packages: Object.values(creditPackages),
  });
}
