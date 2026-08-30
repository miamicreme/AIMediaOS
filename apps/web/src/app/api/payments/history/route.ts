import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../middleware/auth";
import { supabase } from "@aimediaos/db";

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status });
}

interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

interface SubscriptionHistory {
  id: string;
  user_id: string;
  plan_id: string;
  started_at: string;
  ended_at?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { context: authContext, response: authError } = await requireAuth(request);
  if (authError) return authError;

  if (!supabase) return json(500, { error: "Database not configured" });

  try {
    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Fetch credit transactions
    const { data: transactions, error: txError } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", authContext!.userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (txError) {
      console.error("Transaction fetch error:", txError);
      return json(500, { error: "Failed to fetch transactions" });
    }

    // Fetch subscription history
    const { data: subscriptions, error: subError } = await supabase
      .from("subscription_history")
      .select("*")
      .eq("user_id", authContext!.userId)
      .order("started_at", { ascending: false })
      .limit(20);

    if (subError) {
      console.error("Subscription history fetch error:", subError);
      return json(500, { error: "Failed to fetch subscription history" });
    }

    const txData = transactions as CreditTransaction[] || [];
    const subData = subscriptions as SubscriptionHistory[] || [];

    return json(200, {
      credits: {
        transactions: txData.map(tx => ({
          id: tx.id,
          amount: tx.amount,
          type: tx.transaction_type,
          reason: tx.reason,
          createdAt: tx.created_at,
          metadata: tx.metadata,
        })),
        total: txData.length,
      },
      subscriptions: {
        history: subData.map(sub => ({
          id: sub.id,
          planId: sub.plan_id,
          startedAt: sub.started_at,
          endedAt: sub.ended_at,
        })),
        total: subData.length,
      },
      pagination: {
        limit,
        offset,
        hasMore: txData.length === limit,
      },
    });
  } catch (error) {
    console.error("Payment history error:", error);
    return json(500, { error: "Failed to fetch payment history" });
  }
}
