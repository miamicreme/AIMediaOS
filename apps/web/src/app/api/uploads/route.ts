import { NextResponse } from "next/server";
import { isStorageConfigured, uploadMediaFile, validateFile, sanitizeErrorMessage } from "@aimediaos/db";

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status });
}

export async function POST(request: Request) {
  if (!isStorageConfigured()) {
    return json(503, {
      error: "Media storage is not configured.",
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

  const validation = validateFile(file);
  if (!validation.valid) {
    return json(400, { error: validation.error });
  }

  try {
    const { url } = await uploadMediaFile(file);
    return json(201, { url });
  } catch (error) {
    const message = sanitizeErrorMessage(error);
    return json(422, { error: message });
  }
}
