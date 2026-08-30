// Hardening Passes #2-4: Comprehensive Input Validation & Sanitization

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\/.+/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALPHANUMERIC_REGEX = /^[a-zA-Z0-9_-]+$/;

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

// Hardening Pass #2: Email Validation
export function validateEmail(email: unknown): ValidationResult {
  if (typeof email !== "string") {
    return { valid: false, error: "Email must be a string" };
  }

  const trimmed = email.trim().toLowerCase();

  if (trimmed.length < 3 || trimmed.length > 255) {
    return { valid: false, error: "Email length invalid" };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: "Invalid email format" };
  }

  return { valid: true, sanitized: trimmed };
}

// Hardening Pass #3: URL Validation
export function validateUrl(url: unknown): ValidationResult {
  if (typeof url !== "string") {
    return { valid: false, error: "URL must be a string" };
  }

  const trimmed = url.trim();

  if (trimmed.length < 10 || trimmed.length > 2048) {
    return { valid: false, error: "URL length invalid" };
  }

  if (!URL_REGEX.test(trimmed)) {
    return { valid: false, error: "Invalid URL format" };
  }

  try {
    new URL(trimmed);
    return { valid: true, sanitized: trimmed };
  } catch {
    return { valid: false, error: "Invalid URL" };
  }
}

// Hardening Pass #4: String Sanitization
export function sanitizeString(str: unknown, maxLength: number = 1000): ValidationResult {
  if (typeof str !== "string") {
    return { valid: false, error: "Input must be a string" };
  }

  const trimmed = str.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: "Input cannot be empty" };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `Input exceeds maximum length of ${maxLength}` };
  }

  // Remove null bytes
  const sanitized = trimmed.replace(/\0/g, "");

  // Check for control characters
  if (/[\x00-\x1f\x7f]/g.test(sanitized)) {
    return { valid: false, error: "Input contains invalid characters" };
  }

  return { valid: true, sanitized };
}

// Hardening Pass #5: UUID Validation
export function validateUUID(uuid: unknown): ValidationResult {
  if (typeof uuid !== "string") {
    return { valid: false, error: "UUID must be a string" };
  }

  if (!UUID_REGEX.test(uuid)) {
    return { valid: false, error: "Invalid UUID format" };
  }

  return { valid: true, sanitized: uuid.toLowerCase() };
}

// Hardening Pass #6: Alphanumeric Validation
export function validateAlphanumeric(input: unknown, maxLength: number = 100): ValidationResult {
  if (typeof input !== "string") {
    return { valid: false, error: "Input must be a string" };
  }

  if (input.length > maxLength) {
    return { valid: false, error: `Input exceeds maximum length of ${maxLength}` };
  }

  if (!ALPHANUMERIC_REGEX.test(input)) {
    return { valid: false, error: "Input must be alphanumeric with hyphens/underscores only" };
  }

  return { valid: true, sanitized: input };
}

// Hardening Pass #7: Number Validation
export function validateNumber(num: unknown, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): ValidationResult {
  const parsed = Number(num);

  if (isNaN(parsed)) {
    return { valid: false, error: "Input must be a valid number" };
  }

  if (!Number.isInteger(parsed)) {
    return { valid: false, error: "Input must be an integer" };
  }

  if (parsed < min || parsed > max) {
    return { valid: false, error: `Number must be between ${min} and ${max}` };
  }

  return { valid: true, sanitized: String(parsed) };
}

// Hardening Pass #8: Array Validation
export function validateArray<T>(arr: unknown, validator: (item: unknown) => boolean, minLength: number = 1, maxLength: number = 100): ValidationResult {
  if (!Array.isArray(arr)) {
    return { valid: false, error: "Input must be an array" };
  }

  if (arr.length < minLength || arr.length > maxLength) {
    return { valid: false, error: `Array length must be between ${minLength} and ${maxLength}` };
  }

  if (!arr.every(validator)) {
    return { valid: false, error: "Array contains invalid items" };
  }

  return { valid: true };
}

// Hardening Pass #9: JSON Validation
export function validateJSON(json: unknown): ValidationResult {
  try {
    if (typeof json === "string") {
      JSON.parse(json);
      return { valid: true, sanitized: json };
    }
    return { valid: false, error: "Input must be a JSON string" };
  } catch {
    return { valid: false, error: "Invalid JSON" };
  }
}

// Hardening Pass #10: Enum Validation
export function validateEnum<T extends string>(value: unknown, allowedValues: readonly T[]): ValidationResult {
  if (typeof value !== "string") {
    return { valid: false, error: "Value must be a string" };
  }

  if (!allowedValues.includes(value as T)) {
    return { valid: false, error: `Value must be one of: ${allowedValues.join(", ")}` };
  }

  return { valid: true, sanitized: value };
}
