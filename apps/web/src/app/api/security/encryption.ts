// Hardening Passes #17-18: Encryption & Hashing Utilities

import { randomBytes, createHash, createHmac } from "node:crypto";

// Hardening Pass #17: Secure Hashing
export function hashSensitiveData(data: string, algorithm: string = "sha256"): string {
  return createHash(algorithm).update(data).digest("hex");
}

export function hashWithSalt(data: string, salt: string): string {
  const combined = `${data}${salt}`;
  return createHash("sha256").update(combined).digest("hex");
}

export function generateSalt(length: number = 32): string {
  return randomBytes(length).toString("hex");
}

export function verifyHash(original: string, hash: string, salt?: string): boolean {
  if (salt) {
    return hashWithSalt(original, salt) === hash;
  }
  return hashSensitiveData(original) === hash;
}

// Hardening Pass #18: HMAC Authentication
export function generateHMAC(data: string, secret: string, algorithm: string = "sha256"): string {
  return createHmac(algorithm, secret).update(data).digest("hex");
}

export function verifyHMAC(data: string, signature: string, secret: string, algorithm: string = "sha256"): boolean {
  const expected = generateHMAC(data, secret, algorithm);
  // Use constant-time comparison to prevent timing attacks
  return constantTimeCompare(expected, signature);
}

export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Generate cryptographically secure random tokens
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString("hex");
}

export function generateApiKey(prefix: string = "sk_live"): string {
  return `${prefix}_${randomBytes(24).toString("hex")}`;
}

// Password strength validation
export function validatePasswordStrength(password: string): { valid: boolean; score: number; feedback: string[] } {
  const feedback: string[] = [];
  let score = 0;

  if (password.length < 8) {
    feedback.push("Password must be at least 8 characters");
  } else {
    score++;
  }

  if (password.length >= 12) {
    score++;
  }

  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push("Add lowercase letters");
  }

  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push("Add uppercase letters");
  }

  if (/[0-9]/.test(password)) {
    score++;
  } else {
    feedback.push("Add numbers");
  }

  if (/[!@#$%^&*()_+\-=\[\]{};:'",.<>?/\\|`~]/.test(password)) {
    score++;
  } else {
    feedback.push("Add special characters");
  }

  return {
    valid: score >= 4,
    score,
    feedback,
  };
}
