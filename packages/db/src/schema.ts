// Schema validation for API requests

export interface ValidationSchema {
  type: "string" | "number" | "boolean" | "object" | "array";
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minItems?: number;
  maxItems?: number;
  properties?: Record<string, ValidationSchema>;
  items?: ValidationSchema;
  enum?: unknown[];
}

export function validateAgainstSchema(
  data: unknown,
  schema: ValidationSchema
): { valid: boolean; error?: string } {
  if (!data && schema.required) {
    return { valid: false, error: `Field is required.` };
  }

  if (!data) {
    return { valid: true };
  }

  // Type checking
  const dataType = Array.isArray(data) ? "array" : typeof data;
  if (dataType !== schema.type) {
    return { valid: false, error: `Expected ${schema.type}, got ${dataType}.` };
  }

  // String validation
  if (schema.type === "string" && typeof data === "string") {
    if (schema.minLength && data.length < schema.minLength) {
      return { valid: false, error: `Minimum length is ${schema.minLength}.` };
    }
    if (schema.maxLength && data.length > schema.maxLength) {
      return { valid: false, error: `Maximum length is ${schema.maxLength}.` };
    }
    if (schema.pattern) {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(data)) {
        return { valid: false, error: `Does not match required pattern.` };
      }
    }
    if (schema.enum && !schema.enum.includes(data)) {
      return { valid: false, error: `Must be one of: ${schema.enum.join(", ")}.` };
    }
  }

  // Array validation
  if (schema.type === "array" && Array.isArray(data)) {
    if (schema.minItems && data.length < schema.minItems) {
      return { valid: false, error: `Minimum items is ${schema.minItems}.` };
    }
    if (schema.maxItems && data.length > schema.maxItems) {
      return { valid: false, error: `Maximum items is ${schema.maxItems}.` };
    }

    if (schema.items) {
      for (let i = 0; i < data.length; i++) {
        const itemValidation = validateAgainstSchema(data[i], schema.items);
        if (!itemValidation.valid) {
          return {
            valid: false,
            error: `Item ${i}: ${itemValidation.error}`,
          };
        }
      }
    }
  }

  // Object validation
  if (schema.type === "object" && typeof data === "object" && data !== null) {
    if (schema.properties) {
      for (const [key, fieldSchema] of Object.entries(schema.properties)) {
        const value = (data as Record<string, unknown>)[key];
        const fieldValidation = validateAgainstSchema(value, fieldSchema);
        if (!fieldValidation.valid) {
          return {
            valid: false,
            error: `${key}: ${fieldValidation.error}`,
          };
        }
      }
    }
  }

  return { valid: true };
}

export const ImageToImageRequestSchema: ValidationSchema = {
  type: "object",
  properties: {
    prompt: {
      type: "string",
      required: true,
      minLength: 1,
      maxLength: 1000,
    },
    imageUrl: {
      type: "string",
      required: false,
    },
    image_url: {
      type: "string",
      required: false,
    },
    inputImageUrl: {
      type: "string",
      required: false,
    },
    images: {
      type: "array",
      required: false,
      maxItems: 5,
    },
    effectId: {
      type: "string",
      required: false,
      enum: ["ai-clothes-changer", "image-to-image"],
    },
    model: {
      type: "string",
      required: false,
    },
    aspectRatio: {
      type: "string",
      required: false,
      enum: ["1:1", "3:4", "4:3", "16:9", "9:16"],
    },
    resolution: {
      type: "string",
      required: false,
      enum: ["SD", "HD", "1080p", "4K"],
    },
  },
};
