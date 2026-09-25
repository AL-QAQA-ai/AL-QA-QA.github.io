import { streamChat } from "@/lib/ai";
import type { AIStreamChunk } from "@/lib/ai";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export async function* runChat(
  history: ChatTurn[]
): AsyncGenerator<AIStreamChunk, void, unknown> {
  yield* streamChat({ messages: history });
}
