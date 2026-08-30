// Hardening Passes #11-12: Secure Response Headers

import { NextResponse } from "next/server";

// Hardening Pass #11: Security Headers Configuration
export const securityHeaders = {
  // Prevent clickjacking
  "X-Frame-Options": "DENY",

  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",

  // Enable XSS protection in older browsers
  "X-XSS-Protection": "1; mode=block",

  // Control referrer information
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Permission policies
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",

  // Content Security Policy
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https:; font-src 'self'; connect-src 'self' https:",

  // HSTS (HTTP Strict Transport Security)
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",

  // Prevent cache poisoning
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

// Hardening Pass #12: Response Header Utilities
export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add CORS headers
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.headers.set("Access-Control-Max-Age", "3600");

  // Disable caching for API responses
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");

  return response;
}

export function createSecureResponse(status: number, body: unknown): NextResponse {
  const response = NextResponse.json(body, { status });
  return addSecurityHeaders(response);
}

export function createSecureErrorResponse(status: number, message: string): NextResponse {
  const response = NextResponse.json({ error: message }, { status });
  return addSecurityHeaders(response);
}
