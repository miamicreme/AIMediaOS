// Authentication utilities

import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@aimediaos/shared";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function signUp(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    return { user: null, error: error.message };
  }

  // Initialize user profile and credits
  if (data.user) {
    await initializeUserOnboarding(data.user.id, email);
  }

  return { user: data.user, error: null };
}

export async function signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { user: null, error: error.message };
  }

  return { user: data.user, error: null };
}

export async function signOut(): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signOut();
  return { error: error?.message || null };
}

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user || null;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) return null;
  return data as UserProfile;
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<{ error: string | null }> {
  const { error } = await supabase.from("user_profiles").update(updates).eq("id", userId);

  return { error: error?.message || null };
}

async function initializeUserOnboarding(userId: string, email: string): Promise<void> {
  try {
    // Create user profile
    await supabase.from("user_profiles").insert({
      id: userId,
      email,
      subscription_tier: "free",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Initialize credits
    await supabase.from("user_credits").insert({
      user_id: userId,
      balance: 10, // Free tier monthly allowance
      lifetime_purchased: 10,
      lifetime_used: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("User onboarding error:", error);
  }
}

export async function refreshSession(): Promise<{ user: User | null; error: string | null }> {
  const { data, error } = await supabase.auth.refreshSession();

  if (error) {
    return { user: null, error: error.message };
  }

  return { user: data.user, error: null };
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
}
