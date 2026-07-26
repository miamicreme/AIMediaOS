import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@aimediaos/db";
import { getEnv } from "@/lib/env";

export async function GET() {
  const env = getEnv();
  const dbReady = isDatabaseConfigured();
  const storageReady = !!(env.supabaseUrl && env.supabaseAnonKey);

  const status = {
    ok: true,
    timestamp: new Date().toISOString(),
    checks: {
      database: { ready: dbReady, status: dbReady ? "healthy" : "unconfigured" },
      storage: { ready: storageReady, status: storageReady ? "healthy" : "unconfigured" },
      env: { ready: !!(env.supabaseUrl), status: env.supabaseUrl ? "healthy" : "unconfigured" },
    },
    mode: env.isDev ? "development" : "production",
  };

  const statusCode = status.checks.database.ready && status.checks.storage.ready ? 200 : 503;
  return NextResponse.json(status, { status: statusCode });
}
