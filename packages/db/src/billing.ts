// Billing and credit management

import { getSupabaseClient } from "./client";
import type { CreditTransaction, UserCredits } from "@aimediaos/shared";
import { getCreditCost } from "@aimediaos/shared";

export async function getUserCredits(userId: string): Promise<UserCredits | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from("user_credits")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) return null;
    return data as UserCredits;
  } catch {
    return null;
  }
}

export async function hasEnoughCredits(
  userId: string,
  workflowId: string
): Promise<{ hasCreditts: boolean; balance: number; required: number }> {
  const credits = await getUserCredits(userId);
  const required = getCreditCost(workflowId);

  if (!credits) {
    return { hasCreditts: false, balance: 0, required };
  }

  return {
    hasCreditts: credits.balance >= required,
    balance: credits.balance,
    required,
  };
}

export async function deductCredits(
  userId: string,
  workflowId: string,
  jobId: string
): Promise<{ success: boolean; error?: string; newBalance?: number }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: "Database not configured" };
  }

  const creditCost = getCreditCost(workflowId);

  try {
    // Check credits first
    const credits = await getUserCredits(userId);
    if (!credits || credits.balance < creditCost) {
      return {
        success: false,
        error: `Insufficient credits. Required: ${creditCost}, Available: ${credits?.balance || 0}`,
      };
    }

    // Deduct credits
    const { data: updated, error: updateError } = await client
      .from("user_credits")
      .update({
        balance: credits.balance - creditCost,
        lifetime_used: credits.lifetimeUsed + creditCost,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select("balance")
      .single();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Log transaction
    await logTransaction(userId, -creditCost, "usage", `Job: ${jobId}`, {
      workflowId,
      jobId,
    });

    return {
      success: true,
      newBalance: (updated as any).balance,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to deduct credits",
    };
  }
}

export async function addCredits(
  userId: string,
  amount: number,
  transactionType: "purchase" | "bonus" | "refund" | "adjustment",
  reason?: string
): Promise<{ success: boolean; error?: string; newBalance?: number }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: "Database not configured" };
  }

  try {
    const credits = await getUserCredits(userId);
    if (!credits) {
      return { success: false, error: "User credits not found" };
    }

    const { data: updated, error: updateError } = await client
      .from("user_credits")
      .update({
        balance: credits.balance + amount,
        lifetime_purchased: transactionType === "purchase" ? credits.lifetimePurchased + amount : credits.lifetimePurchased,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select("balance")
      .single();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    await logTransaction(userId, amount, transactionType, reason);

    return {
      success: true,
      newBalance: (updated as any).balance,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add credits",
    };
  }
}

async function logTransaction(
  userId: string,
  amount: number,
  transactionType: string,
  reason?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from("credit_transactions").insert({
      user_id: userId,
      amount,
      transaction_type: transactionType,
      reason,
      metadata,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to log transaction:", error);
  }
}

export async function trackUsage(
  userId: string,
  workflowId: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: "Database not configured" };
  }

  try {
    const today = new Date().toISOString().split("T")[0];

    // Upsert usage record (increment if exists)
    const { error } = await client.from("usage_analytics").upsert(
      {
        user_id: userId,
        date: today,
        workflow: workflowId,
        count: 1,
        created_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,date,workflow",
      }
    );

    if (error) {
      console.error("Usage tracking error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to track usage",
    };
  }
}

export async function getUserUsage(userId: string, days: number = 30): Promise<Record<string, number>> {
  const client = getSupabaseClient();
  if (!client) return {};

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data } = await client
      .from("usage_analytics")
      .select("workflow, count")
      .eq("user_id", userId)
      .gte("date", startDate.toISOString().split("T")[0]);

    if (!data) return {};

    const usage: Record<string, number> = {};
    for (const row of data) {
      usage[(row as any).workflow] = ((row as any).count || 0) + (usage[(row as any).workflow] || 0);
    }

    return usage;
  } catch {
    return {};
  }
}

export async function initializeUserCredits(userId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from("user_credits").insert({
      user_id: userId,
      balance: 0,
      lifetime_purchased: 0,
      lifetime_used: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    // Silently fail if already exists
    console.debug("User credits initialization:", error);
  }
}
