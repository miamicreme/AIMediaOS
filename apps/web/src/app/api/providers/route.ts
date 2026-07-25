import { NextResponse } from "next/server";
import { providers } from "@aimediaos/providers";
import { isStorageConfigured } from "@aimediaos/db";

export async function GET() {
  return NextResponse.json({
    providers: providers.map((provider) => ({
      id: provider.id,
      label: provider.label,
      configured: provider.isConfigured(),
    })),
    storage: { configured: isStorageConfigured() },
  });
}
