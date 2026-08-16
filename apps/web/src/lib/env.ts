// Environment validation and configuration

export interface EnvConfig {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  nodeEnv: "development" | "production" | "test";
  isDev: boolean;
  isProd: boolean;
}

let cachedConfig: EnvConfig | null = null;

export function getEnv(): EnvConfig {
  if (cachedConfig) return cachedConfig;

  const nodeEnv = (process.env.NODE_ENV || "development") as "development" | "production" | "test";

  const config: EnvConfig = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
    nodeEnv,
    isDev: nodeEnv === "development",
    isProd: nodeEnv === "production",
  };

  cachedConfig = config;
  return config;
}

export function validateEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const env = getEnv();

  if (env.isProd) {
    if (!env.supabaseUrl) errors.push("SUPABASE_URL is required in production.");
    if (!env.supabaseAnonKey) errors.push("SUPABASE_ANON_KEY is required in production.");
  }

  if (env.supabaseUrl && !isValidUrl(env.supabaseUrl)) {
    errors.push("SUPABASE_URL is not a valid URL.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function getConfigStatus(): {
  storageReady: boolean;
  reason?: string;
} {
  const env = getEnv();
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    return {
      storageReady: false,
      reason: "Supabase configuration incomplete. Local preview only.",
    };
  }
  return { storageReady: true };
}
