import { NextResponse, NextRequest } from "next/server";
import {
  getClientIp,
  checkRateLimit,
  addSecurityHeaders,
  validateContentType,
  withTimeout,
} from "./security";
import { logger, generateRequestId, type LogContext } from "@/lib/logging";

type Handler = (request: NextRequest, context?: any) => Promise<NextResponse>;

export function withSecurity(
  handler: Handler,
  options: {
    expectedContentType?: "json" | "formdata";
    timeout?: number;
    rateLimit?: boolean;
  } = {}
): Handler {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const requestId = generateRequestId();
    const ip = getClientIp(request);
    const url = new URL(request.url);

    const logContext: LogContext = {
      requestId,
      endpoint: `${request.method} ${url.pathname}`,
      timestamp: new Date().toISOString(),
    };

    try {
      // Rate limiting
      if (options.rateLimit !== false) {
        const rateLimitCheck = checkRateLimit(ip);
        if (!rateLimitCheck.allowed) {
          logger.warn("Rate limit exceeded", logContext);
          const response = NextResponse.json(
            { error: "Too many requests. Please try again later." },
            { status: 429 }
          );
          response.headers.set("Retry-After", String(rateLimitCheck.retryAfter || 60));
          return addSecurityHeaders(response);
        }
      }

      // Content-Type validation
      if (options.expectedContentType) {
        const contentTypeCheck = validateContentType(request, options.expectedContentType);
        if (!contentTypeCheck.valid) {
          logger.warn("Invalid content type", logContext, { received: request.headers.get("content-type") });
          return addSecurityHeaders(
            NextResponse.json({ error: contentTypeCheck.error }, { status: 400 })
          );
        }
      }

      // Execute handler with timeout
      const response = await withTimeout(handler(request, context), options.timeout || 30000);

      // Add security headers and request ID
      const securedResponse = addSecurityHeaders(response);
      securedResponse.headers.set("X-Request-ID", requestId);

      logger.debug("Request completed", logContext, {
        status: securedResponse.status,
      });

      return securedResponse;
    } catch (error) {
      logger.error("Request failed", logContext, error as Error);

      if (error instanceof Error && error.message.includes("timeout")) {
        return addSecurityHeaders(
          NextResponse.json({ error: "Request timeout." }, { status: 504 })
        );
      }

      const response = NextResponse.json(
        { error: "An error occurred. Please try again later.", requestId },
        { status: 500 }
      );
      return addSecurityHeaders(response);
    }
  };
}
