import { z } from "zod";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodType;
  permissions: ToolPermission[];
  timeout: number;
  confirmationRequired: boolean;
}

export type ToolPermission = "read" | "write" | "execute" | "network" | "sensitive";

export type ToolStatus = "idle" | "running" | "completed" | "error";

export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface ToolExecutionContext {
  userId: string;
  agentId?: string;
  permissions: ToolPermission[];
}

export type ToolHandler = (
  params: Record<string, unknown>,
  context: ToolExecutionContext
) => Promise<ToolResult>;
