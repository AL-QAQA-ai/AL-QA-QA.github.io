import type { AIProvider, AIProviderConfig } from "../types";
import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import { FallbackProvider } from "./fallback";

export type ProviderName = "openai" | "anthropic" | "fallback";

const providers = new Map<string, AIProvider>();

function getEnv(key: string): string {
  return process.env[key] ?? "";
}

export function getProvider(name?: ProviderName): AIProvider {
  const providerName = name ?? detectProvider();

  if (providers.has(providerName)) {
    return providers.get(providerName)!;
  }

  let provider: AIProvider;

  switch (providerName) {
    case "openai": {
      const config: AIProviderConfig = {
        apiKey: getEnv("OPENAI_API_KEY"),
        model: getEnv("OPENAI_MODEL") || "gpt-4o",
        temperature: 0.7,
        maxTokens: 4096,
      };
      provider = new OpenAIProvider(config);
      break;
    }
    case "anthropic": {
      const config: AIProviderConfig = {
        apiKey: getEnv("ANTHROPIC_API_KEY"),
        model: getEnv("ANTHROPIC_MODEL") || "claude-sonnet-4-20250514",
        temperature: 0.7,
        maxTokens: 4096,
      };
      provider = new AnthropicProvider(config);
      break;
    }
    default:
      provider = new FallbackProvider();
  }

  providers.set(providerName, provider);
  return provider;
}

function detectProvider(): ProviderName {
  if (getEnv("OPENAI_API_KEY")) return "openai";
  if (getEnv("ANTHROPIC_API_KEY")) return "anthropic";
  return "fallback";
}

export function getActiveProvider(): AIProvider {
  return getProvider();
}

export function getAllProviders(): { name: string; configured: boolean }[] {
  const openaiKey = getEnv("OPENAI_API_KEY");
  const anthropicKey = getEnv("ANTHROPIC_API_KEY");

  return [
    { name: "openai", configured: !!openaiKey },
    { name: "anthropic", configured: !!anthropicKey },
    { name: "fallback", configured: true },
  ];
}

export { FallbackProvider };
