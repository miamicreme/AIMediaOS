import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireAuth } from "../middleware/auth";
import { supabase } from "@aimediaos/db";

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status });
}

interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  last_used_at?: string;
  created_at: string;
  expires_at?: string;
}

function generateApiKey(): string {
  return `sk_live_${randomUUID().replace(/-/g, "")}`;
}

function getKeyPrefix(key: string): string {
  return key.substring(0, 12);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { context: authContext, response: authError } = await requireAuth(request);
  if (authError) return authError;

  if (!supabase) return json(500, { error: "Database not configured" });

  try {
    const { data: keys, error } = await supabase
      .from("api_keys")
      .select("id, name, key_prefix, last_used_at, created_at, expires_at")
      .eq("user_id", authContext!.userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("API keys fetch error:", error);
      return json(500, { error: "Failed to fetch API keys" });
    }

    const keyData = keys as Omit<ApiKey, "key_prefix" | "user_id">[] || [];

    return json(200, {
      keys: keyData.map(k => ({
        id: k.id,
        name: k.name,
        keyPrefix: k.key_prefix,
        lastUsedAt: k.last_used_at,
        createdAt: k.created_at,
        expiresAt: k.expires_at,
      })),
      total: keyData.length,
    });
  } catch (error) {
    console.error("API keys error:", error);
    return json(500, { error: "Failed to fetch API keys" });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { context: authContext, response: authError } = await requireAuth(request);
  if (authError) return authError;

  if (!supabase) return json(500, { error: "Database not configured" });

  let body: { name?: string; expiresAt?: string };

  try {
    body = (await request.json()) as { name?: string; expiresAt?: string };
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const name = body.name || `API Key ${new Date().toISOString().split("T")[0]}`;

  if (name.length > 100) {
    return json(400, { error: "API key name must be 100 characters or less" });
  }

  try {
    const apiKey = generateApiKey();
    const keyPrefix = getKeyPrefix(apiKey);

    const { data: created, error } = await supabase
      .from("api_keys")
      .insert({
        user_id: authContext!.userId,
        name,
        key: apiKey,
        key_prefix: keyPrefix,
        expires_at: body.expiresAt || null,
        created_at: new Date().toISOString(),
      })
      .select("id, name, key_prefix, created_at, expires_at")
      .single();

    if (error) {
      console.error("API key creation error:", error);
      return json(500, { error: "Failed to create API key" });
    }

    const createdData = created as Omit<ApiKey, "user_id" | "last_used_at">;

    return json(201, {
      id: createdData.id,
      name: createdData.name,
      key: apiKey,
      keyPrefix: createdData.key_prefix,
      createdAt: createdData.created_at,
      expiresAt: createdData.expires_at,
      warning: "Save this key somewhere safe. You won't be able to see it again.",
    });
  } catch (error) {
    console.error("API key creation error:", error);
    return json(500, { error: "Failed to create API key" });
  }
}
