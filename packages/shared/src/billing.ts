// Billing and subscription types

export type SubscriptionTier = "free" | "pro" | "enterprise" | "pay-as-you-go";

export type TransactionType = "purchase" | "usage" | "refund" | "bonus" | "adjustment";

export type InvoiceStatus = "draft" | "sent" | "paid" | "failed" | "void";

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceUsdCents: number;
  creditsPerMonth: number;
  isRecurring: boolean;
  stripePriceId?: string;
  features: string[];
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  subscriptionTier: SubscriptionTier;
  subscriptionStartAt?: string;
  subscriptionEndAt?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserCredits {
  id: string;
  userId: string;
  balance: number;
  lifetimePurchased: number;
  lifetimeUsed: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  transactionType: TransactionType;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface UsageAnalytics {
  id: string;
  userId: string;
  date: string;
  workflow: string;
  count: number;
  createdAt: string;
}

export interface Invoice {
  id: string;
  userId: string;
  stripeInvoiceId?: string;
  amountUsdCents: number;
  creditsPurchased?: number;
  status: InvoiceStatus;
  paidAt?: string;
  dueAt?: string;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  userId: string;
  keyPreview: string;
  name?: string;
  lastUsedAt?: string;
  createdAt: string;
  deletedAt?: string;
}

// Pricing configuration
export const PRICING = {
  FREE_TIER_CREDITS_PER_MONTH: 10,
  PAY_AS_YOU_GO_CENTS_PER_CREDIT: 10, // $0.10 per generation
  PRO_MONTHLY_PRICE_CENTS: 9900, // $99.00
  PRO_ANNUAL_PRICE_CENTS: 99900, // $999.00
  ANNUAL_SAVINGS_PERCENT: 20,
  TRIAL_PERIOD_DAYS: 14,
} as const;

// Credit costs per operation
export const CREDIT_COSTS = {
  "text-to-image": 1,
  "image-to-image": 1,
  "ai-clothes-changer": 2, // More complex
  "image-to-video": 3, // Most expensive
} as const;

export function getCreditCost(workflowId: string): number {
  return (CREDIT_COSTS as Record<string, number>)[workflowId] || 1;
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function getPricePerGeneration(subscriptionTier: SubscriptionTier): string {
  switch (subscriptionTier) {
    case "pro":
      return "Unlimited";
    case "enterprise":
      return "Custom";
    case "pay-as-you-go":
      return formatPrice(PRICING.PAY_AS_YOU_GO_CENTS_PER_CREDIT);
    case "free":
    default:
      return `${PRICING.FREE_TIER_CREDITS_PER_MONTH} free per month`;
  }
}
