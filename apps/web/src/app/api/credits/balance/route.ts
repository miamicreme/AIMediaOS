import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../middleware/auth";
import { getUserCredits, getUserUsage } from "@aimediaos/db/billing";

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status });
}

interface UserCreditsData {
  balance: number;
  lifetime_purchased: number;
  lifetime_used: number;
  created_at: string;
  updated_at: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { context: authContext, response: authError } = await requireAuth(request);
  if (authError) return authError;

  try {
    const credits = await getUserCredits(authContext!.userId);

    if (!credits) {
      return json(404, { error: "User credits not found" });
    }

    const creditsData = credits as UserCreditsData;
    const usage = await getUserUsage(authContext!.userId, 30);

    return json(200, {
      balance: creditsData.balance,
      lifetimePurchased: creditsData.lifetime_purchased,
      lifetimeUsed: creditsData.lifetime_used,
      usage: usage,
      createdAt: creditsData.created_at,
      updatedAt: creditsData.updated_at,
    });
  } catch (error) {
    console.error("Credits fetch error:", error);
    return json(500, { error: "Failed to fetch credits" });
  }
}
