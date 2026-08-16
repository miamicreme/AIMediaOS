// Sanitization and XSS prevention utilities

const XSS_PATTERNS = [
  /<script[^>]*>[\s\S]*?<\/script>/gi,
  /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // onclick=, onload=, etc.
  /<embed[^>]*>/gi,
  /<object[^>]*>[\s\S]*?<\/object>/gi,
];

const MAX_RECURSION_DEPTH = 10;
const MAX_OBJECT_SIZE = 10000; // bytes

export function sanitizeString(input: string): string {
  let sanitized = input.trim();

  // Remove XSS patterns
  for (const pattern of XSS_PATTERNS) {
    sanitized = sanitized.replace(pattern, "");
  }

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, "");

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, " ");

  return sanitized;
}

export function validateRecursionDepth(obj: unknown, depth: number = 0): boolean {
  if (depth > MAX_RECURSION_DEPTH) {
    return false;
  }

  if (typeof obj === "object" && obj !== null) {
    for (const value of Object.values(obj)) {
      if (!validateRecursionDepth(value, depth + 1)) {
        return false;
      }
    }
  }

  return true;
}

export function validateObjectSize(obj: unknown): boolean {
  const serialized = JSON.stringify(obj);
  return serialized.length <= MAX_OBJECT_SIZE;
}

export function validateRequestObject(obj: unknown): {
  valid: boolean;
  error?: string;
} {
  if (typeof obj !== "object" || obj === null) {
    return { valid: false, error: "Request must be an object." };
  }

  if (!validateRecursionDepth(obj)) {
    return { valid: false, error: "Request structure too deeply nested." };
  }

  if (!validateObjectSize(obj)) {
    return { valid: false, error: "Request payload too large." };
  }

  return { valid: true };
}

export function sanitizeObject(obj: unknown): unknown {
  if (typeof obj === "string") {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  if (typeof obj === "object" && obj !== null) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

export function validatePromptForXSS(prompt: string): {
  valid: boolean;
  error?: string;
} {
  const sanitized = sanitizeString(prompt);

  if (sanitized.length === 0) {
    return { valid: false, error: "Prompt cannot be empty." };
  }

  if (sanitized !== prompt) {
    // Prompt contained XSS patterns
    return { valid: false, error: "Prompt contains invalid characters or patterns." };
  }

  return { valid: true };
}

export function preventReDoS(pattern: string): boolean {
  // Detect common ReDoS patterns
  const suspiciousPatterns = [
    /(\w+\+)+/,  // a+b+c+ (nested quantifiers)
    /(\w+\*)+/,  // a*b*c* (nested quantifiers)
    /(\|.*\|)+/, // a|b|c (alternation)
  ];

  for (const regex of suspiciousPatterns) {
    if (regex.test(pattern)) {
      return false;
    }
  }

  return true;
}
