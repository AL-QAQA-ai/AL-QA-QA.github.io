import { NextResponse } from "next/server";
import { streamChat, chat } from "@/lib/ai";
import { messageSchema } from "@/lib/validations";
import { createConversation, addMessage, getMessages } from "@/lib/memory";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = messageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { content, conversationId } = parsed.data;
    const userId = body.userId;
    const stream = body.stream !== false;

    // Resolve conversation
    let activeConversationId = conversationId;
    if (!activeConversationId && userId) {
      const conv = await createConversation({ userId, title: content.slice(0, 100) });
      activeConversationId = conv.id;
    }

    // Load history for context
    const history: { role: "user" | "assistant" | "system"; content: string }[] = [];
    if (activeConversationId) {
      const previous = await getMessages(activeConversationId);
      for (const msg of previous) {
        if (msg.role === "user" || msg.role === "assistant") {
          history.push({ role: msg.role as "user" | "assistant", content: msg.content });
        }
      }
    }

    // Save user message
    if (activeConversationId) {
      await addMessage(activeConversationId, "user", content);
    }

    if (stream) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          let fullContent = "";
          try {
            for await (const chunk of streamChat({
              messages: [...history, { role: "user", content }],
            })) {
              if (chunk.type === "text" && chunk.content) {
                fullContent += chunk.content;
              }
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
              );
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));

            // Save assistant message
            if (activeConversationId && fullContent) {
              await addMessage(activeConversationId, "assistant", fullContent);
            }
          } catch (error) {
            const errChunk = {
              type: "error" as const,
              error: error instanceof Error ? error.message : "Unknown error",
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(errChunk)}\n\n`)
            );
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Conversation-Id": activeConversationId ?? "",
        },
      });
    }

    const response = await chat({
      messages: [...history, { role: "user", content }],
    });

    if (activeConversationId) {
      await addMessage(activeConversationId, "assistant", response.content);
    }

    return NextResponse.json({
      content: response.content,
      model: response.model,
      usage: response.usage,
      conversationId: activeConversationId,
    });
  } catch (error) {
    console.error("[Chat API Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
