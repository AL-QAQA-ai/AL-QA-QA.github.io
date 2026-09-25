import { z } from "zod";

export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export function validateEmail(email: string): boolean {
  return z.string().email().safeParse(email).success;
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 6) errors.push("At least 6 characters");
  if (password.length > 128) errors.push("Max 128 characters");
  return { valid: errors.length === 0, errors };
}

export function detectInjection(input: string): boolean {
  const patterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC)\b)/i,
    new RegExp("--|;|/\\*|\\*/|xp_"),
    /(\$\{|\$\(|<script|javascript:)/i,
    /(\.\.\/|\.\.\\)/,
  ];
  return patterns.some((p) => p.test(input));
}

export function maskSecret(value: string): string {
  if (!value || value.length < 8) return "***";
  return value.slice(0, 4) + "*".repeat(value.length - 8) + value.slice(-4);
}

export function generateCSRFToken(): string {
  return crypto.randomUUID();
}
