import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(100000, "Message too long"),
  conversationId: z.string().optional(),
});

export const conversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  model: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type ConversationInput = z.infer<typeof conversationSchema>;
