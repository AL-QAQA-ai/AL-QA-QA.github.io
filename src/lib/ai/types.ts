export interface AIMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
}

export interface AIStreamChunk {
  type: "text" | "tool_call" | "error" | "done";
  content?: string;
  toolCall?: ToolCall;
  error?: string;
  usage?: TokenUsage;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AIProviderConfig {
  apiKey: string;
  baseUrl?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface AICompletionRequest {
  messages: AIMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: ToolDefinition[];
}

export interface AICompletionResponse {
  content: string;
  model: string;
  usage: TokenUsage;
  toolCalls?: ToolCall[];
  finishReason: "stop" | "tool_calls" | "length" | "content_filter";
}

export interface AIProvider {
  readonly name: string;
  readonly isConfigured: boolean;

  chat(request: AICompletionRequest): Promise<AICompletionResponse>;
  stream(
    request: AICompletionRequest
  ): AsyncGenerator<AIStreamChunk, void, unknown>;
  getAvailableModels(): string[];
  validate(): Promise<boolean>;
}
