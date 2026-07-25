import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null | undefined;

/**
 * Server-side Supabase client. Prefers the service role key (bypasses RLS);
 * falls back to the anon key, which works too since the MVP migration's RLS
 * policies are intentionally permissive (no auth yet — see README).
 * Returns null when unconfigured so callers can fall back to local-only
 * behavior instead of crashing.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

  cached = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return cached;
}

export function isDatabaseConfigured(): boolean {
  return getSupabaseClient() !== null;
}
