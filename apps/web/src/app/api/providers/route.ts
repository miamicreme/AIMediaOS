import { NextResponse } from "next/server";
import { providers } from "@aimediaos/providers";

export async function GET() {
  return NextResponse.json({
    providers: providers.map((provider) => ({
      id: provider.id,
      label: provider.label,
      configured: provider.isConfigured(),
    })),
  });
}
