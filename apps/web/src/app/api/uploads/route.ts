import { NextResponse } from "next/server";
import { isStorageConfigured, uploadMediaFile } from "@aimediaos/db";

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status });
}

export async function POST(request: Request) {
  if (!isStorageConfigured()) {
    return json(503, {
      error: "Media storage is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) to upload images for real generation.",
    });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json(400, { error: "Expected multipart/form-data with a 'file' field." });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return json(400, { error: "Missing 'file' field." });
  }

  try {
    const { url } = await uploadMediaFile(file);
    return json(201, { url });
  } catch (error) {
    return json(422, { error: error instanceof Error ? error.message : "Upload failed." });
  }
}
