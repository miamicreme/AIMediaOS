import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../middleware/auth";
import { supabase } from "@aimediaos/db";

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status });
}

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  subscription_tier: string;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { context: authContext, response: authError } = await requireAuth(request);
  if (authError) return authError;

  if (!supabase) return json(500, { error: "Database not configured" });

  try {
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("id, email, name, subscription_tier, stripe_customer_id, created_at, updated_at")
      .eq("id", authContext!.userId)
      .single();

    if (error || !profile) {
      return json(404, { error: "Profile not found" });
    }

    const profileData = profile as UserProfile;

    return json(200, {
      id: profileData.id,
      email: profileData.email,
      name: profileData.name,
      subscriptionTier: profileData.subscription_tier,
      stripeCustomerId: profileData.stripe_customer_id,
      createdAt: profileData.created_at,
      updatedAt: profileData.updated_at,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return json(500, { error: "Failed to fetch profile" });
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const { context: authContext, response: authError } = await requireAuth(request);
  if (authError) return authError;

  if (!supabase) return json(500, { error: "Database not configured" });

  let body: { name?: string; email?: string };

  try {
    body = (await request.json()) as { name?: string; email?: string };
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  if (!body.name && !body.email) {
    return json(400, { error: "At least one field (name or email) is required" });
  }

  try {
    const updates: Record<string, string> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name) updates.name = body.name;
    if (body.email) updates.email = body.email;

    const { data: profile, error } = await supabase
      .from("user_profiles")
      .update(updates)
      .eq("id", authContext!.userId)
      .select("id, email, name, subscription_tier, stripe_customer_id, created_at, updated_at")
      .single();

    if (error || !profile) {
      return json(500, { error: "Failed to update profile" });
    }

    const profileData = profile as UserProfile;

    return json(200, {
      id: profileData.id,
      email: profileData.email,
      name: profileData.name,
      subscriptionTier: profileData.subscription_tier,
      stripeCustomerId: profileData.stripe_customer_id,
      createdAt: profileData.created_at,
      updatedAt: profileData.updated_at,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return json(500, { error: "Failed to update profile" });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const { context: authContext, response: authError } = await requireAuth(request);
  if (authError) return authError;

  if (!supabase) return json(500, { error: "Database not configured" });

  try {
    // Delete user profile
    const { error: deleteError } = await supabase
      .from("user_profiles")
      .delete()
      .eq("id", authContext!.userId);

    if (deleteError) {
      return json(500, { error: "Failed to delete profile" });
    }

    // Delete auth user
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(authContext!.userId);

    if (authDeleteError) {
      console.error("Auth user deletion error:", authDeleteError);
    }

    return json(200, { message: "Profile deleted successfully" });
  } catch (error) {
    console.error("Profile deletion error:", error);
    return json(500, { error: "Failed to delete profile" });
  }
}
