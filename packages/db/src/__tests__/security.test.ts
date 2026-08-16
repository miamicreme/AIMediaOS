import {
  sanitizeString,
  validateRecursionDepth,
  validateObjectSize,
  validatePromptForXSS,
  preventReDoS,
} from "../sanitization";
import { validateAgainstSchema } from "../schema";
import { validateJobIntegrity } from "../integrity";

describe("Security", () => {
  describe("Sanitization", () => {
    it("removes XSS script tags", () => {
      const dangerous = "Hello <script>alert('xss')</script> world";
      const sanitized = sanitizeString(dangerous);
      expect(sanitized).not.toContain("<script>");
    });

    it("removes onclick handlers", () => {
      const dangerous = '<img src="x" onclick="alert(1)" />';
      const sanitized = sanitizeString(dangerous);
      expect(sanitized).not.toContain("onclick=");
    });

    it("removes javascript: protocol", () => {
      const dangerous = '<a href="javascript:alert(1)">Click</a>';
      const sanitized = sanitizeString(dangerous);
      expect(sanitized).not.toContain("javascript:");
    });

    it("removes control characters", () => {
      const dangerous = "Hello\x00World\x1F";
      const sanitized = sanitizeString(dangerous);
      expect(sanitized).not.toContain("\x00");
    });

    it("validates prompt for XSS", () => {
      const result = validatePromptForXSS("Safe prompt");
      expect(result.valid).toBe(true);
    });

    it("rejects prompt with XSS", () => {
      const result = validatePromptForXSS("Unsafe <script>alert(1)</script>");
      expect(result.valid).toBe(false);
    });
  });

  describe("Recursion", () => {
    it("accepts shallow objects", () => {
      const obj = { a: 1, b: { c: 2 } };
      expect(validateRecursionDepth(obj)).toBe(true);
    });

    it("rejects deeply nested objects", () => {
      let obj: any = { a: 1 };
      for (let i = 0; i < 15; i++) {
        obj = { nested: obj };
      }
      expect(validateRecursionDepth(obj)).toBe(false);
    });
  });

  describe("Object Size", () => {
    it("accepts reasonable sized objects", () => {
      const obj = { text: "Hello World" };
      expect(validateObjectSize(obj)).toBe(true);
    });

    it("rejects very large objects", () => {
      const largeString = "x".repeat(20000);
      const obj = { text: largeString };
      expect(validateObjectSize(obj)).toBe(false);
    });
  });

  describe("ReDoS Prevention", () => {
    it("rejects nested quantifiers", () => {
      expect(preventReDoS("(a+)+")).toBe(false);
      expect(preventReDoS("(a*)*")).toBe(false);
    });

    it("accepts safe patterns", () => {
      expect(preventReDoS("^hello$")).toBe(true);
      expect(preventReDoS("[a-z]+")).toBe(true);
    });
  });

  describe("Schema Validation", () => {
    it("validates basic types", () => {
      const schema = { type: "string" as const };
      expect(validateAgainstSchema("hello", schema).valid).toBe(true);
      expect(validateAgainstSchema(123, schema).valid).toBe(false);
    });

    it("validates string length", () => {
      const schema = {
        type: "string" as const,
        minLength: 3,
        maxLength: 10,
      };
      expect(validateAgainstSchema("hello", schema).valid).toBe(true);
      expect(validateAgainstSchema("hi", schema).valid).toBe(false);
      expect(validateAgainstSchema("a".repeat(15), schema).valid).toBe(false);
    });

    it("validates enums", () => {
      const schema = {
        type: "string" as const,
        enum: ["red", "green", "blue"],
      };
      expect(validateAgainstSchema("red", schema).valid).toBe(true);
      expect(validateAgainstSchema("yellow", schema).valid).toBe(false);
    });

    it("validates arrays", () => {
      const schema = {
        type: "array" as const,
        minItems: 1,
        maxItems: 3,
      };
      expect(validateAgainstSchema([], schema).valid).toBe(false);
      expect(validateAgainstSchema([1, 2], schema).valid).toBe(true);
      expect(validateAgainstSchema([1, 2, 3, 4], schema).valid).toBe(false);
    });
  });

  describe("Job Integrity", () => {
    it("rejects invalid job ID", () => {
      const job = {
        id: "not-a-uuid",
        workflow_id: "test",
        kind: "image-to-image",
        status: "queued",
        provider: "seedream",
        inputImages: [],
        resultUrls: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any;

      const result = validateJobIntegrity(job);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("ID format"))).toBe(true);
    });

    it("rejects invalid status", () => {
      const job = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        workflow_id: "test",
        kind: "image-to-image",
        status: "invalid-status",
        provider: "seedream",
        inputImages: [],
        resultUrls: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any;

      const result = validateJobIntegrity(job);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("status"))).toBe(true);
    });

    it("accepts valid job", () => {
      const job = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        workflow_id: "test",
        kind: "image-to-image",
        status: "queued",
        provider: "seedream",
        inputImages: [],
        resultUrls: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any;

      const result = validateJobIntegrity(job);
      expect(result.valid).toBe(true);
    });
  });
});
