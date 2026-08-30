import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireAuth } from "../../middleware/auth";
import { supabase } from "@aimediaos/db";

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status });
}

function generateApiKey(): string {
  return `sk_live_${randomUUID().replace(/-/g, "")}`;
}

function getKeyPrefix(key: string): string {
  return key.substring(0, 12);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  const { context: authContext, response: authError } = await requireAuth(request);
  if (authError) return authError;

  if (!supabase) return json(500, { error: "Database not configured" });

  try {
    // Verify ownership before deleting
    const { data: apiKey, error: checkError } = await supabase
      .from("api_keys")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", authContext!.userId)
      .single();

    if (checkError || !apiKey) {
      return json(404, { error: "API key not found" });
    }

    // Delete the key
    const { error: deleteError } = await supabase
      .from("api_keys")
      .delete()
      .eq("id", params.id);

    if (deleteError) {
      console.error("API key deletion error:", deleteError);
      return json(500, { error: "Failed to delete API key" });
    }

    return json(200, { message: "API key deleted successfully" });
  } catch (error) {
    console.error("API key deletion error:", error);
    return json(500, { error: "Failed to delete API key" });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  const { context: authContext, response: authError } = await requireAuth(request);
  if (authError) return authError;

  if (!supabase) return json(500, { error: "Database not configured" });

  let body: { action?: string };

  try {
    body = (await request.json()) as { action?: string };
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  if (body.action !== "rotate") {
    return json(400, { error: "Only 'rotate' action is supported" });
  }

  try {
    // Verify ownership before rotating
    const { data: apiKey, error: checkError } = await supabase
      .from("api_keys")
      .select("id, name, expires_at")
      .eq("id", params.id)
      .eq("user_id", authContext!.userId)
      .single();

    if (checkError || !apiKey) {
      return json(404, { error: "API key not found" });
    }

    const apiKeyData = apiKey as { id: string; name: string; expires_at?: string };

    // Generate new key
    const newKey = generateApiKey();
    const keyPrefix = getKeyPrefix(newKey);

    // Update with new key
    const { data: updated, error: updateError } = await supabase
      .from("api_keys")
      .update({
        key: newKey,
        key_prefix: keyPrefix,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select("id, name, key_prefix, created_at, expires_at")
      .single();

    if (updateError) {
      console.error("API key rotation error:", updateError);
      return json(500, { error: "Failed to rotate API key" });
    }

    const updatedData = updated as { id: string; name: string; key_prefix: string; created_at: string; expires_at?: string };

    return json(200, {
      id: updatedData.id,
      name: updatedData.name,
      key: newKey,
      keyPrefix: updatedData.key_prefix,
      createdAt: updatedData.created_at,
      expiresAt: updatedData.expires_at,
      warning: "Save this new key somewhere safe. The old key will stop working immediately.",
    });
  } catch (error) {
    console.error("API key rotation error:", error);
    return json(500, { error: "Failed to rotate API key" });
  }
}
