import {
  validatePrompt,
  validateJobId,
  validateImageUrl,
  validateImageUrls,
  validateFile,
  validateAspectRatio,
  validateResolution,
  sanitizeErrorMessage,
} from "../validation";

describe("Validation", () => {
  describe("validatePrompt", () => {
    it("accepts valid prompts", () => {
      const result = validatePrompt("A beautiful sunset");
      expect(result.valid).toBe(true);
      expect(result.value).toBe("A beautiful sunset");
    });

    it("rejects empty prompts", () => {
      const result = validatePrompt("");
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("rejects non-string prompts", () => {
      const result = validatePrompt(123);
      expect(result.valid).toBe(false);
    });

    it("trims whitespace", () => {
      const result = validatePrompt("  test  ");
      expect(result.value).toBe("test");
    });

    it("rejects prompts exceeding max length", () => {
      const longPrompt = "x".repeat(1001);
      const result = validatePrompt(longPrompt);
      expect(result.valid).toBe(false);
    });
  });

  describe("validateJobId", () => {
    it("accepts valid UUIDs", () => {
      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      const result = validateJobId(uuid);
      expect(result.valid).toBe(true);
    });

    it("rejects invalid UUIDs", () => {
      const result = validateJobId("not-a-uuid");
      expect(result.valid).toBe(false);
    });
  });

  describe("validateImageUrl", () => {
    it("accepts http URLs", () => {
      const result = validateImageUrl("http://example.com/image.jpg");
      expect(result.valid).toBe(true);
      expect(result.value).toBe("http://example.com/image.jpg");
    });

    it("accepts https URLs", () => {
      const result = validateImageUrl("https://example.com/image.jpg");
      expect(result.valid).toBe(true);
    });

    it("rejects non-http protocols", () => {
      const result = validateImageUrl("file:///local/image.jpg");
      expect(result.valid).toBe(false);
    });

    it("rejects invalid URLs", () => {
      const result = validateImageUrl("not a url");
      expect(result.valid).toBe(false);
    });
  });

  describe("validateImageUrls", () => {
    it("accepts arrays of valid URLs", () => {
      const urls = ["https://example.com/1.jpg", "https://example.com/2.jpg"];
      const result = validateImageUrls(urls);
      expect(result.valid).toBe(true);
      expect(result.values).toEqual(urls);
    });

    it("rejects empty arrays", () => {
      const result = validateImageUrls([]);
      expect(result.valid).toBe(false);
    });

    it("rejects arrays exceeding max length", () => {
      const urls = Array(6).fill("https://example.com/image.jpg");
      const result = validateImageUrls(urls);
      expect(result.valid).toBe(false);
    });

    it("rejects if any URL is invalid", () => {
      const urls = ["https://example.com/1.jpg", "invalid"];
      const result = validateImageUrls(urls);
      expect(result.valid).toBe(false);
    });
  });

  describe("validateAspectRatio", () => {
    it("accepts valid ratios", () => {
      expect(validateAspectRatio("1:1").valid).toBe(true);
      expect(validateAspectRatio("3:4").valid).toBe(true);
      expect(validateAspectRatio("16:9").valid).toBe(true);
    });

    it("rejects invalid ratios", () => {
      expect(validateAspectRatio("2:3").valid).toBe(false);
    });
  });

  describe("validateResolution", () => {
    it("accepts valid resolutions", () => {
      expect(validateResolution("HD").valid).toBe(true);
      expect(validateResolution("1080p").valid).toBe(true);
      expect(validateResolution("4K").valid).toBe(true);
    });

    it("rejects invalid resolutions", () => {
      expect(validateResolution("720p").valid).toBe(false);
    });
  });

  describe("sanitizeErrorMessage", () => {
    it("sanitizes SQL errors", () => {
      const error = new Error("SELECT * FROM users WHERE id = 1");
      const sanitized = sanitizeErrorMessage(error);
      expect(sanitized).toBe("Database operation failed.");
    });

    it("sanitizes connection errors", () => {
      const error = new Error("ECONNREFUSED: Connection refused");
      const sanitized = sanitizeErrorMessage(error);
      expect(sanitized).toBe("Service temporarily unavailable.");
    });

    it("preserves safe error messages", () => {
      const error = new Error("File too large.");
      const sanitized = sanitizeErrorMessage(error);
      expect(sanitized).toBe("File too large.");
    });
  });
});
