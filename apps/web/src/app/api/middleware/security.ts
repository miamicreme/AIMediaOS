import { NextResponse, NextRequest } from "next/server";

const REQUEST_TIMEOUT_MS = 30000; // 30 seconds
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // Per window

// In-memory rate limiter (per IP)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const bucket = rateLimitStore.get(ip);

  if (!bucket || now >= bucket.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((bucket.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  bucket.count++;
  return { allowed: true };
}

export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Enable XSS protection (for older browsers)
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy (formerly Feature-Policy)
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
}

export function validateContentType(
  request: NextRequest,
  expectedType: "json" | "formdata"
): { valid: boolean; error?: string } {
  const contentType = request.headers.get("content-type") || "";

  if (expectedType === "json") {
    if (!contentType.includes("application/json")) {
      return { valid: false, error: "Content-Type must be application/json." };
    }
  } else if (expectedType === "formdata") {
    if (!contentType.includes("multipart/form-data")) {
      return { valid: false, error: "Content-Type must be multipart/form-data." };
    }
  }

  return { valid: true };
}

export function createTimeoutAbortSignal(timeoutMs: number = REQUEST_TIMEOUT_MS): AbortSignal {
  return AbortSignal.timeout(timeoutMs);
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout.")), timeoutMs)
    ),
  ]);
}
