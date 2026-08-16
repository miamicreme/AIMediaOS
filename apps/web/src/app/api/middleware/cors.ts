import { NextResponse, NextRequest } from "next/server";

export const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
];

export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}

export function addCorsHeaders(response: NextResponse, origin: string | null): NextResponse {
  if (isOriginAllowed(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.headers.set("Access-Control-Max-Age", "86400"); // 24 hours
  response.headers.set("Access-Control-Allow-Credentials", "true");

  return response;
}

export function handleCorsPreFlight(request: NextRequest): NextResponse | null {
  if (request.method !== "OPTIONS") return null;

  const origin = request.headers.get("origin");
  const response = new NextResponse(null, { status: 204 });

  return addCorsHeaders(response, origin);
}
