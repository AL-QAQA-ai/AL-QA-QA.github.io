import type { ToolPermission } from "../tools/types";

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  scope: string[];
  permissions: ToolPermission[];
  systemPrompt: string;
  model?: string;
  enabled: boolean;
}

export interface AgentExecutionContext {
  userId: string;
  conversationId?: string;
  input: string;
  history: { role: string; content: string }[];
}

export type AgentRouteResult = {
  agentId: string;
  confidence: number;
  reason: string;
};
