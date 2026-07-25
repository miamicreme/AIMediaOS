import { getSupabaseClient } from "./client";

const BUCKET = "media";
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export function isStorageConfigured(): boolean {
  return getSupabaseClient() !== null;
}

export async function uploadMediaFile(file: File): Promise<{ url: string }> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase storage is not configured.");

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error(`Unsupported file type: ${file.type || "unknown"}.`);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`File is too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024}MB).`);
  }

  const extension = file.type.split("/")[1] ?? "bin";
  const path = `uploads/${crypto.randomUUID()}.${extension}`;

  const { error } = await client.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  const { data } = client.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}
