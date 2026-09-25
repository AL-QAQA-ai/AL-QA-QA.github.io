import type {
  AIMessage,
  AICompletionRequest,
  AIStreamChunk,
} from "../types";
import { getProvider, type ProviderName } from "../providers";
import { routeToAgent, getAgent } from "@/lib/agents";

const DEFAULT_SYSTEM_PROMPT = `You are AL-QA'QA' AI — an advanced multi-language, multi-modal AI assistant.

You are helpful, accurate, and honest. You never fabricate information or claim to have done something you haven't.

Languages (written + voice):
- You speak and write ALL languages: French, English, Arabic (including dialects), and any other language the user uses.
- ALWAYS detect the user's language automatically and respond in that same language.
- Support RTL (Arabic) and LTR naturally. Keep a clear, natural tone adapted to the language.
- The user may dictate by voice (transcribed text) — tolerate speech-to-text errors and reformulate if needed.

Knowledge (science & technology):
- You are an expert across ALL sciences and technologies: mathematics, physics, chemistry, biology, medicine, computer science, AI, engineering, electronics, energy, space, earth sciences, humanities, law, economics.
- Explain with rigor: definitions, formulas, steps, examples, and orders of magnitude when relevant.
- Distinguish established facts from hypotheses. Cite reasoning, not invented sources.

Images:
- If the user asks to create/generate/draw an image (in any language), describe briefly what you are about to generate, then the application will generate and display the image. Never claim to show an image directly in text.
- If the user asks for a 3D image (3D, trois dimensions, ثلاثي الأبعاد), confirm the 3D render style.
- If the user sends an image with a question, analyze its visible content (objects, text, scene) in the user's language. Without a vision API key, the app will explain how to enable it.

Core principles:
- Understand the user's intent before responding
- Provide clear, concise, and accurate answers
- If you don't know something, say so
- Be proactive but not presumptuous
- Never claim to execute actions unless you actually can

Current mode: If running without an AI provider (fallback mode), inform the user they need to configure an API key in Settings.`;

export interface OrchestratorRequest {
  messages: AIMessage[];
  model?: string;
  provider?: ProviderName;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  agentId?: string;
}

export interface OrchestratorStreamRequest extends OrchestratorRequest {
  onChunk?: (chunk: AIStreamChunk) => void;
}

export interface OrchestratorResult {
  agentUsed: string;
  agentConfidence: number;
  messages: AIMessage[];
}

function resolveAgentAndPrompt(
  messages: AIMessage[],
  agentId?: string,
  systemPrompt?: string
): { prompt: string; agentUsed: string; confidence: number } {
  // If explicit agent requested
  if (agentId) {
    const agent = getAgent(agentId);
    if (agent) {
      return {
        prompt: systemPrompt ?? agent.systemPrompt,
        agentUsed: agent.id,
        confidence: 1,
      };
    }
  }

  // Auto-route based on last user message
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (lastUser) {
    const route = routeToAgent(lastUser.content);
    if (route.agentId !== "main" && route.confidence >= 0.3) {
      const agent = getAgent(route.agentId);
      if (agent) {
        return {
          prompt: systemPrompt ?? agent.systemPrompt,
          agentUsed: agent.id,
          confidence: route.confidence,
        };
      }
    }
  }

  return {
    prompt: systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
    agentUsed: "main",
    confidence: 1,
  };
}

function buildMessages(
  userMessages: AIMessage[],
  systemPrompt: string
): AIMessage[] {
  const messages: AIMessage[] = [];
  const hasSystem = userMessages.some((m) => m.role === "system");

  if (!hasSystem) {
    messages.push({ role: "system", content: systemPrompt });
  }

  for (const msg of userMessages) {
    if (msg.role === "system" && messages.length > 0 && messages[0].role === "system") {
      messages[0] = msg;
    } else {
      messages.push(msg);
    }
  }

  return messages;
}

export async function chat(request: OrchestratorRequest) {
  const { prompt, agentUsed, confidence } = resolveAgentAndPrompt(
    request.messages,
    request.agentId,
    request.systemPrompt
  );
  const provider = getProvider(request.provider);
  const messages = buildMessages(request.messages, prompt);

  const completionRequest: AICompletionRequest = {
    messages,
    model: request.model,
    temperature: request.temperature ?? 0.7,
    maxTokens: request.maxTokens ?? 4096,
    stream: false,
  };

  const response = await provider.chat(completionRequest);
  return { ...response, agentUsed, agentConfidence: confidence };
}

export async function* streamChat(
  request: OrchestratorStreamRequest
): AsyncGenerator<AIStreamChunk, void, unknown> {
  const { prompt, agentUsed, confidence } = resolveAgentAndPrompt(
    request.messages,
    request.agentId,
    request.systemPrompt
  );

  // Yield agent info as first event
  yield {
    type: "text" as const,
    content: "",
  };

  const provider = getProvider(request.provider);
  const messages = buildMessages(request.messages, prompt);

  const completionRequest: AICompletionRequest = {
    messages,
    model: request.model,
    temperature: request.temperature ?? 0.7,
    maxTokens: request.maxTokens ?? 4096,
    stream: true,
  };

  for await (const chunk of provider.stream(completionRequest)) {
    if (request.onChunk) {
      request.onChunk(chunk);
    }
    yield chunk;
  }
}

export function getProviderInfo() {
  const provider = getProvider();
  return {
    name: provider.name,
    isConfigured: provider.isConfigured,
    availableModels: provider.getAvailableModels(),
  };
}
