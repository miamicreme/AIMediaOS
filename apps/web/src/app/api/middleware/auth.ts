import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getWorkflowById } from "@aimediaos/workflows";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AuthContext {
  userId: string;
  email: string;
  subscriptionTier: string;
}

export async function getAuthContext(request: NextRequest): Promise<{ context: AuthContext | null; error: string | null }> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return { context: null, error: "Missing authorization header" };
    }

    const token = authHeader.slice(7);

    // Verify the token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return { context: null, error: "Invalid token" };
    }

    // Get user profile for subscription tier
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single();

    return {
      context: {
        userId: user.id,
        email: user.email || "",
        subscriptionTier: (profile as any)?.subscription_tier || "free",
      },
      error: null,
    };
  } catch (error) {
    return { context: null, error: "Auth error" };
  }
}

export async function requireAuth(request: NextRequest): Promise<{ context: AuthContext; response: null } | { context: null; response: NextResponse }> {
  const { context, error } = await getAuthContext(request);

  if (!context || error) {
    return {
      context: null,
      response: NextResponse.json({ error: error || "Unauthorized" }, { status: 401 }),
    };
  }

  return { context, response: null };
}

export async function checkCredits(
  userId: string,
  workflowId: string
): Promise<{ hasCredits: boolean; balance: number; required: number; error?: string }> {
  try {
    // Get credit cost from workflow definition
    const workflow = getWorkflowById(workflowId);
    const required = workflow?.creditCost || 1;

    // Get user credits
    const { data: credits, error } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (error || !credits) {
      return {
        hasCredits: false,
        balance: 0,
        required,
        error: "Could not check credits",
      };
    }

    return {
      hasCredits: (credits as any).balance >= required,
      balance: (credits as any).balance,
      required,
    };
  } catch (error) {
    return {
      hasCredits: false,
      balance: 0,
      required: 1,
      error: "Credit check error",
    };
  }
}
