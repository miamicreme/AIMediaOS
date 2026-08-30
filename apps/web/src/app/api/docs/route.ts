import { NextResponse } from "next/server";

const apiDocs = {
  version: "1.0.0",
  title: "AIMediaOS API",
  baseUrl: "https://api.aimediaos.com",
  authentication: {
    type: "Bearer Token",
    header: "Authorization: Bearer <token>",
    description: "All endpoints require authentication unless specified otherwise",
  },
  endpoints: {
    auth: {
      category: "Authentication",
      endpoints: [
        {
          method: "POST",
          path: "/api/auth/signup",
          description: "Register a new user account",
          public: true,
          requestBody: { email: "string", password: "string" },
          response: { userId: "string", token: "string" },
        },
        {
          method: "POST",
          path: "/api/auth/signin",
          description: "Sign in with email and password",
          public: true,
          requestBody: { email: "string", password: "string" },
          response: { userId: "string", token: "string" },
        },
        {
          method: "POST",
          path: "/api/auth/logout",
          description: "Sign out current user",
          requiresAuth: true,
          response: { success: "boolean" },
        },
      ],
    },
    users: {
      category: "User Management",
      endpoints: [
        {
          method: "GET",
          path: "/api/users/profile",
          description: "Get current user profile",
          requiresAuth: true,
          response: {
            id: "string",
            email: "string",
            name: "string",
            subscriptionTier: "string",
            createdAt: "timestamp",
          },
        },
        {
          method: "PUT",
          path: "/api/users/profile",
          description: "Update user profile (name, email)",
          requiresAuth: true,
          requestBody: { name: "string (optional)", email: "string (optional)" },
          response: { id: "string", email: "string", name: "string" },
        },
        {
          method: "DELETE",
          path: "/api/users/profile",
          description: "Delete user account and data",
          requiresAuth: true,
          response: { message: "string" },
        },
      ],
    },
    credits: {
      category: "Credits & Billing",
      endpoints: [
        {
          method: "GET",
          path: "/api/credits/balance",
          description: "Get current credit balance and usage stats",
          requiresAuth: true,
          response: {
            balance: "number",
            lifetimePurchased: "number",
            lifetimeUsed: "number",
            usage: "Record<string, number>",
          },
        },
        {
          method: "GET",
          path: "/api/credits/purchase",
          description: "List available credit packages",
          public: true,
          response: {
            packages: "array of {id, credits, price}",
          },
        },
        {
          method: "POST",
          path: "/api/credits/purchase",
          description: "Create checkout session for credit purchase",
          requiresAuth: true,
          requestBody: { packageId: "string (starter|standard|professional|enterprise)" },
          response: { sessionId: "string", url: "string", credits: "number" },
        },
      ],
    },
    jobs: {
      category: "Media Jobs",
      endpoints: [
        {
          method: "GET",
          path: "/api/jobs",
          description: "List all user jobs",
          requiresAuth: true,
          response: { jobs: "array of MediaJob objects" },
        },
        {
          method: "POST",
          path: "/api/jobs",
          description: "Create a new media job",
          requiresAuth: true,
          requestBody: { workflowId: "string", prompt: "string", model: "string (optional)" },
          response: { job: "MediaJob object" },
        },
        {
          method: "GET",
          path: "/api/jobs/:id",
          description: "Get job details and status",
          requiresAuth: true,
          response: { job: "MediaJob object" },
        },
        {
          method: "POST",
          path: "/api/jobs/:id",
          description: "Cancel a job",
          requiresAuth: true,
          requestBody: { action: "string (cancel)" },
          response: { job: "MediaJob object", message: "string" },
        },
      ],
    },
    workflows: {
      category: "Workflow-Specific",
      endpoints: [
        {
          method: "POST",
          path: "/api/text-to-image/generate",
          description: "Generate image from text prompt",
          requiresAuth: true,
          requestBody: {
            workflowId: "string (text-to-image)",
            prompt: "string",
            model: "string (optional)",
          },
          response: { job: "MediaJob object" },
        },
        {
          method: "POST",
          path: "/api/image-to-image/generate",
          description: "Transform an image",
          requiresAuth: true,
          requestBody: {
            workflowId: "string (image-to-image|ai-clothes-changer)",
            inputImages: "string[] (image URLs)",
            prompt: "string (optional)",
          },
          response: { job: "MediaJob object" },
        },
        {
          method: "POST",
          path: "/api/image-to-video/generate",
          description: "Generate video from image",
          requiresAuth: true,
          requestBody: {
            workflowId: "string (image-to-video)",
            inputImages: "string[] (image URLs)",
            prompt: "string (motion prompt, optional)",
          },
          response: { job: "MediaJob object" },
        },
      ],
    },
    payments: {
      category: "Payments & Invoices",
      endpoints: [
        {
          method: "GET",
          path: "/api/billing/subscription",
          description: "Get current subscription status",
          requiresAuth: true,
          response: { tier: "string", customerId: "string" },
        },
        {
          method: "PUT",
          path: "/api/billing/subscription",
          description: "Cancel subscription",
          requiresAuth: true,
          requestBody: { action: "string (cancel)" },
          response: { message: "string" },
        },
        {
          method: "GET",
          path: "/api/payments/history",
          description: "Get payment and credit transaction history",
          requiresAuth: true,
          queryParams: { limit: "number (default: 20)", offset: "number (default: 0)" },
          response: { credits: "object", subscriptions: "object", pagination: "object" },
        },
        {
          method: "GET",
          path: "/api/invoices",
          description: "List user invoices",
          requiresAuth: true,
          queryParams: { status: "string (draft|issued|paid|overdue|cancelled)" },
          response: { invoices: "array", stats: "object", pagination: "object" },
        },
        {
          method: "GET",
          path: "/api/invoices/:id",
          description: "Get specific invoice details",
          requiresAuth: true,
          response: { id: "string", amount: "number", status: "string" },
        },
      ],
    },
    apiKeys: {
      category: "API Keys",
      endpoints: [
        {
          method: "GET",
          path: "/api/api-keys",
          description: "List all API keys",
          requiresAuth: true,
          response: { keys: "array of {id, name, keyPrefix}", total: "number" },
        },
        {
          method: "POST",
          path: "/api/api-keys",
          description: "Create new API key",
          requiresAuth: true,
          requestBody: { name: "string (optional)", expiresAt: "timestamp (optional)" },
          response: { id: "string", key: "string", warning: "string" },
        },
        {
          method: "DELETE",
          path: "/api/api-keys/:id",
          description: "Delete API key",
          requiresAuth: true,
          response: { message: "string" },
        },
        {
          method: "POST",
          path: "/api/api-keys/:id",
          description: "Rotate API key",
          requiresAuth: true,
          requestBody: { action: "string (rotate)" },
          response: { id: "string", key: "string", warning: "string" },
        },
      ],
    },
    refunds: {
      category: "Refunds",
      endpoints: [
        {
          method: "POST",
          path: "/api/refunds",
          description: "Request refund for failed job",
          requiresAuth: true,
          requestBody: { jobId: "string", reason: "string" },
          response: { id: "string", jobId: "string", status: "string" },
        },
        {
          method: "GET",
          path: "/api/refunds",
          description: "List refund requests",
          requiresAuth: true,
          queryParams: { status: "string (pending|approved|rejected|completed)" },
          response: { refunds: "array", total: "number" },
        },
      ],
    },
    metadata: {
      category: "Metadata",
      endpoints: [
        {
          method: "GET",
          path: "/api/catalog",
          description: "List available workflows and tools",
          public: true,
          response: { categories: "array", tools: "array" },
        },
        {
          method: "GET",
          path: "/api/gallery",
          description: "Get gallery of completed jobs",
          public: true,
          response: { items: "array", total: "number" },
        },
        {
          method: "GET",
          path: "/api/health",
          description: "API health check",
          public: true,
          response: { status: "string", timestamp: "timestamp" },
        },
      ],
    },
  },
  errorCodes: {
    400: "Bad Request - Invalid parameters or body",
    401: "Unauthorized - Missing or invalid authentication",
    402: "Payment Required - Insufficient credits",
    403: "Forbidden - Unauthorized access to resource",
    404: "Not Found - Resource does not exist",
    422: "Unprocessable Entity - Job submission failed",
    500: "Internal Server Error",
  },
  rateLimits: {
    authenticated: "100 requests per minute",
    public: "10 requests per minute",
  },
};

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(apiDocs, { status: 200 });
}
