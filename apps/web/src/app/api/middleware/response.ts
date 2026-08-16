import { NextResponse } from "next/server";

export const CacheStrategy = {
  // No cache for sensitive data
  NO_CACHE: "no-cache, no-store, must-revalidate",
  // Cache for short period (5 minutes)
  SHORT: "public, max-age=300",
  // Cache for medium period (1 hour)
  MEDIUM: "public, max-age=3600",
  // Cache for long period (24 hours) - for static assets
  LONG: "public, max-age=86400",
  // Private cache for authenticated users
  PRIVATE_SHORT: "private, max-age=300",
  PRIVATE_MEDIUM: "private, max-age=3600",
};

export interface PaginationOptions {
  page?: number;
  limit?: number;
  maxLimit?: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function validatePagination(
  options: PaginationOptions
): { page: number; limit: number; offset: number; error?: string } {
  const page = Math.max(1, options.page || DEFAULT_PAGE);
  const limit = Math.min(options.maxLimit || MAX_LIMIT, options.limit || DEFAULT_LIMIT);

  if (limit < 1) {
    return { page, limit: 1, offset: 0, error: "Limit must be at least 1" };
  }

  if (page < 1) {
    return { page: 1, limit, offset: 0, error: "Page must be at least 1" };
  }

  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function addCacheHeaders(
  response: NextResponse,
  strategy: string = CacheStrategy.NO_CACHE
): NextResponse {
  response.headers.set("Cache-Control", strategy);
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  baseUrl?: string
) {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      nextPage: hasNextPage ? page + 1 : null,
      previousPage: hasPreviousPage ? page - 1 : null,
    },
  };
}

export function validateJsonResponse(data: unknown): {
  valid: boolean;
  error?: string;
} {
  try {
    JSON.stringify(data);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: "Response contains non-serializable data" };
  }
}

export function addVaryHeader(
  response: NextResponse,
  vary: string[]
): NextResponse {
  response.headers.set("Vary", vary.join(", "));
  return response;
}

export function addDeprecationHeader(
  response: NextResponse,
  message: string,
  sunsetDate?: Date
): NextResponse {
  response.headers.set("Deprecation", "true");
  response.headers.set("Warning", `299 - "${message}"`);

  if (sunsetDate) {
    response.headers.set("Sunset", sunsetDate.toUTCString());
  }

  return response;
}

export function enableCompression(response: NextResponse): NextResponse {
  // Next.js handles compression automatically, but we can signal it
  response.headers.set("Accept-Encoding", "gzip, deflate, br");
  return response;
}

// Validation helpers for common response types
export const ResponseValidators = {
  errorResponse: (error: unknown) => {
    return {
      error: error instanceof Error ? error.message : String(error),
    };
  },

  successResponse: <T,>(data: T, meta?: Record<string, unknown>) => {
    return {
      success: true,
      data,
      meta,
    };
  },

  listResponse: <T,>(items: T[], total: number, page: number, limit: number) => {
    return createPaginatedResponse(items, page, limit, total);
  },
};
