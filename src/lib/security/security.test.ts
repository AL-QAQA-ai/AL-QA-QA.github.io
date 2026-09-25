import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { sanitizeInput, validateEmail, validatePassword, detectInjection, maskSecret } from "@/lib/security/validation";

describe("Rate Limiting", () => {
  beforeEach(() => {
    // Note: rate limit store is in-memory, not easily reset
  });

  it("allows requests under limit", () => {
    const key = `test-${Date.now()}`;
    const result = checkRateLimit(key, { windowMs: 60000, maxRequests: 5 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("blocks requests over limit", () => {
    const key = `test-block-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, { windowMs: 60000, maxRequests: 5 });
    }
    const result = checkRateLimit(key, { windowMs: 60000, maxRequests: 5 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });
})

describe("Input Sanitization", () => {
  it("escapes HTML characters", () => {
    expect(sanitizeInput("<script>alert(1)</script>")).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(sanitizeInput('"hello"')).toBe("&quot;hello&quot;");
    expect(sanitizeInput("'world'")).toBe("&#x27;world&#x27;");
  })
})

describe("Email Validation", () => {
  it("validates correct emails", () => {
    expect(validateEmail("test@example.com")).toBe(true);
    expect(validateEmail("user.name@domain.org")).toBe(true);
  })

  it("rejects invalid emails", () => {
    expect(validateEmail("invalid")).toBe(false);
    expect(validateEmail("@domain.com")).toBe(false);
    expect(validateEmail("user@")).toBe(false);
  })
})

describe("Password Validation", () => {
  it("accepts valid passwords", () => {
    const result = validatePassword("password123");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  })

  it("rejects too short passwords", () => {
    const result = validatePassword("123");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("At least 6 characters");
  })

  it("rejects too long passwords", () => {
    const long = "a".repeat(129);
    const result = validatePassword(long);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Max 128 characters");
  })
})

describe("Injection Detection", () => {
  it("detects SQL injection patterns", () => {
    expect(detectInjection("SELECT * FROM users")).toBe(true);
    expect(detectInjection("'; DROP TABLE users;--")).toBe(true);
    expect(detectInjection("UNION SELECT password")).toBe(true);
  })

  it("detects XSS patterns", () => {
    expect(detectInjection("<script>alert(1)</script>")).toBe(true);
    expect(detectInjection("javascript:alert(1)")).toBe(true);
  })

  it("detects path traversal", () => {
    expect(detectInjection("../../etc/passwd")).toBe(true);
  })

  it("allows safe input", () => {
    expect(detectInjection("hello world")).toBe(false);
    expect(detectInjection("user@example.com")).toBe(false);
  })
})

describe("Secret Masking", () => {
  it("masks long secrets", () => {
    expect(maskSecret("sk-1234567890abcdef")).toBe("sk-1***********cdef");
  })

  it("masks short values completely", () => {
    expect(maskSecret("abc")).toBe("***");
  })
})