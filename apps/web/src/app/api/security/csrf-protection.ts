// Hardening Passes #15-16: CSRF Protection & Token Management

import { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";

interface CSRFToken {
  token: string;
  userId: string;
  expiresAt: number;
  ipAddress: string;
}

const tokenStore = new Map<string, CSRFToken>();
const TOKEN_EXPIRY = 3600000; // 1 hour
const CLEANUP_INTERVAL = 600000; // 10 minutes

// Cleanup expired tokens
setInterval(() => {
  const now = Date.now();
  for (const [key, token] of tokenStore.entries()) {
    if (token.expiresAt < now) {
      tokenStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

// Hardening Pass #15: CSRF Token Generation
export function generateCSRFToken(): string {
  return randomBytes(32).toString("hex");
}

// Hardening Pass #16: CSRF Token Storage & Validation
export function storeCSRFToken(token: string, userId: string, ipAddress: string): void {
  const csrfToken: CSRFToken = {
    token,
    userId,
    ipAddress,
    expiresAt: Date.now() + TOKEN_EXPIRY,
  };

  tokenStore.set(token, csrfToken);
}

export function validateCSRFToken(token: string, userId: string, ipAddress: string): boolean {
  const stored = tokenStore.get(token);

  if (!stored) {
    return false;
  }

  // Token expired
  if (stored.expiresAt < Date.now()) {
    tokenStore.delete(token);
    return false;
  }

  // User mismatch
  if (stored.userId !== userId) {
    return false;
  }

  // IP address changed (security check)
  if (stored.ipAddress !== ipAddress) {
    return false;
  }

  // Token is valid, consume it
  tokenStore.delete(token);
  return true;
}

export function getClientIpAddress(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "unknown";
}

export function extractCSRFToken(request: NextRequest): string | null {
  const fromHeader = request.headers.get("x-csrf-token");
  if (fromHeader) {
    return fromHeader;
  }

  const fromCookie = request.cookies.get("csrf-token");
  if (fromCookie) {
    return fromCookie.value;
  }

  return null;
}
