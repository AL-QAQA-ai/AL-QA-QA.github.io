import type {
  AIProvider,
  AIProviderConfig,
  AICompletionRequest,
  AICompletionResponse,
  AIStreamChunk,
} from "../types";

export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  get isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  getAvailableModels(): string[] {
    return [
      "claude-sonnet-4-20250514",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
    ];
  }

  async validate(): Promise<boolean> {
    if (!this.isConfigured) return false;
    try {
      const res = await fetch("https://api.anthropic.com/v1/models", {
        headers: {
          "x-api-key": this.config.apiKey,
          "anthropic-version": "2023-06-01",
        },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async chat(request: AICompletionRequest): Promise<AICompletionResponse> {
    const { system, messages } = this.convertMessages(request.messages);

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: request.model || this.config.model,
        max_tokens: request.maxTokens ?? this.config.maxTokens ?? 4096,
        temperature: request.temperature ?? this.config.temperature ?? 0.7,
        ...(system ? { system } : {}),
        messages,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        `Anthropic API error: ${res.status} ${JSON.stringify(err)}`
      );
    }

    const data = await res.json();
    const textBlock = data.content?.find(
      (b: { type: string }) => b.type === "text"
    );

    return {
      content: textBlock?.text ?? "",
      model: data.model,
      usage: {
        promptTokens: data.usage?.input_tokens ?? 0,
        completionTokens: data.usage?.output_tokens ?? 0,
        totalTokens:
          (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      },
      finishReason: this.mapStopReason(data.stop_reason),
    };
  }

  async *stream(
    request: AICompletionRequest
  ): AsyncGenerator<AIStreamChunk, void, unknown> {
    const { system, messages } = this.convertMessages(request.messages);

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: request.model || this.config.model,
        max_tokens: request.maxTokens ?? this.config.maxTokens ?? 4096,
        temperature: request.temperature ?? this.config.temperature ?? 0.7,
        stream: true,
        ...(system ? { system } : {}),
        messages,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      yield {
        type: "error",
        error: `Anthropic API error: ${res.status} ${JSON.stringify(err)}`,
      };
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      yield { type: "error", error: "No response body" };
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          try {
            const event = JSON.parse(trimmed.slice(6));
            if (event.type === "content_block_delta") {
              yield { type: "text", content: event.delta?.text ?? "" };
            } else if (event.type === "message_stop") {
              yield { type: "done" };
              return;
            }
          } catch {
            // skip
          }
        }
      }
      yield { type: "done" };
    } finally {
      reader.releaseLock();
    }
  }

  private convertMessages(messages: AICompletionRequest["messages"]): {
    system: string | undefined;
    messages: { role: string; content: string }[];
  } {
    let system: string | undefined;
    const converted: { role: string; content: string }[] = [];

    for (const msg of messages) {
      if (msg.role === "system") {
        system = msg.content;
      } else {
        converted.push({ role: msg.role, content: msg.content });
      }
    }

    return { system, messages: converted };
  }

  private mapStopReason(
    reason: string | undefined
  ): "stop" | "tool_calls" | "length" | "content_filter" {
    if (reason === "end_turn" || reason === "stop_sequence") return "stop";
    if (reason === "max_tokens") return "length";
    return "stop";
  }
}
