// Input validation utilities for security and correctness

const PROMPT_MAX_LENGTH = 1000;
const PROMPT_MIN_LENGTH = 1;
const JOB_ID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const MAX_IMAGES_PER_REQUEST = 5;
const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

export function validatePrompt(prompt: unknown): { valid: boolean; error?: string; value?: string } {
  if (typeof prompt !== "string") {
    return { valid: false, error: "Prompt must be a string." };
  }
  const trimmed = prompt.trim();
  if (trimmed.length < PROMPT_MIN_LENGTH) {
    return { valid: false, error: "Prompt cannot be empty." };
  }
  if (trimmed.length > PROMPT_MAX_LENGTH) {
    return { valid: false, error: `Prompt must be ${PROMPT_MAX_LENGTH} characters or less.` };
  }
  return { valid: true, value: trimmed };
}

export function validateJobId(jobId: unknown): { valid: boolean; error?: string } {
  if (typeof jobId !== "string") {
    return { valid: false, error: "Job ID must be a string." };
  }
  if (!JOB_ID_PATTERN.test(jobId)) {
    return { valid: false, error: "Invalid job ID format." };
  }
  return { valid: true };
}

export function validateImageUrl(url: unknown): { valid: boolean; error?: string; value?: string } {
  if (typeof url !== "string") {
    return { valid: false, error: "Image URL must be a string." };
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { valid: false, error: "Image URL must use http or https protocol." };
    }
    return { valid: true, value: url };
  } catch {
    return { valid: false, error: "Invalid image URL format." };
  }
}

export function validateImageUrls(urls: unknown[]): { valid: boolean; error?: string; values?: string[] } {
  if (!Array.isArray(urls)) {
    return { valid: false, error: "Images must be an array." };
  }
  if (urls.length === 0) {
    return { valid: false, error: "At least one image URL is required." };
  }
  if (urls.length > MAX_IMAGES_PER_REQUEST) {
    return { valid: false, error: `Maximum ${MAX_IMAGES_PER_REQUEST} images per request.` };
  }

  const validatedUrls: string[] = [];
  for (const url of urls) {
    const validation = validateImageUrl(url);
    if (!validation.valid) {
      return { valid: false, error: `Invalid image URL: ${validation.error}` };
    }
    validatedUrls.push(validation.value!);
  }
  return { valid: true, values: validatedUrls };
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { valid: false, error: `Unsupported file type: ${file.type || "unknown"}.` };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File is too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB).` };
  }
  if (file.size === 0) {
    return { valid: false, error: "File is empty." };
  }
  return { valid: true };
}

export function validateAspectRatio(ratio: unknown): { valid: boolean; error?: string } {
  const validRatios = ["1:1", "3:4", "4:3", "16:9", "9:16"];
  if (!validRatios.includes(ratio as string)) {
    return { valid: false, error: `Invalid aspect ratio. Must be one of: ${validRatios.join(", ")}.` };
  }
  return { valid: true };
}

export function validateResolution(resolution: unknown): { valid: boolean; error?: string } {
  const validResolutions = ["SD", "HD", "1080p", "4K"];
  if (!validResolutions.includes(resolution as string)) {
    return { valid: false, error: `Invalid resolution. Must be one of: ${validResolutions.join(", ")}.` };
  }
  return { valid: true };
}

export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    // Don't leak SQL, database connection details, or stack traces
    if (msg.includes("SELECT") || msg.includes("INSERT") || msg.includes("UPDATE")) {
      return "Database operation failed.";
    }
    if (msg.includes("ECONNREFUSED") || msg.includes("ETIMEDOUT")) {
      return "Service temporarily unavailable.";
    }
    return msg;
  }
  return "An error occurred.";
}
