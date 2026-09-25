"use client";

import { useState, useCallback, useRef } from "react";
import { Sidebar } from "./sidebar";
import { CommandBar } from "@/components/chat/command-bar";
import { ChatArea } from "@/components/chat/chat-area";
import type { Message } from "@/types";

const IMAGE_TRIGGERS = [
  /^\/(image|imagine|img)\b/i,
  /(crée|crées|créer|cree|creer|génère|générer|genere|generer|dessine|dessiner|montre-moi|fais-moi).*(image|photo|illustration|dessin|visuel)/i,
  /(create|generate|make|draw|show me).*(image|picture|photo|illustration|drawing|visual)/i,
  /(انشئ|اصنع|ولّد|ولد|ارسم|اعمل).*(صورة|صور|رسم)/,
  /صورة.*(ل|de|of)/,
];

function isImageRequest(content: string): boolean {
  const text = content.trim();
  return IMAGE_TRIGGERS.some((re) => re.test(text));
}

function extractImagePrompt(content: string): string {
  let prompt = content.trim();
  prompt = prompt.replace(/^\/(image|imagine|img)\b\s*/i, "");
  prompt = prompt
    .replace(/^(s'il te plaît|stp|please)\s+[,!-]?\s*/i, "")
    .replace(/^(crée|crées|créer|cree|creer|génère|générer|genere|generer|dessine|dessiner|fais|fais-moi|montre-moi)\s+(moi\s+)?(une\s+|un\s+)?(image|photo|illustration|dessin|visuel)\s+(de|du|d'|sur|avec|pour|qui montre|représentant)?\s*/i, "")
    .replace(/^(create|generate|make|draw|show me)\s+(me\s+)?(an?\s+)?(image|picture|photo|illustration|drawing|visual)\s+(of|about|with|showing)?\s*/i, "")
    .trim();
  return prompt.slice(0, 500) || content.trim().slice(0, 500);
}

function is3DRequest(content: string): boolean {
  return /(3\s?-?\s?d|three[-\s]?d|trois dimensions?|en 3d|style 3d|ثلاثي الأبعاد|ثلاثية الأبعاد|مجسم|立体)/i.test(
    content
  );
}

function with3DStyle(prompt: string): string {
  if (/3d render|octane render/i.test(prompt)) return prompt;
  return `${prompt}, 3D render, octane render, volumetric lighting, ultra detailed`;
}

export function MainLayout() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [autoSpeak, setAutoSpeak] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleSend = useCallback(async (content: string, imageDataUrl?: string) => {
    const userContent =
      imageDataUrl && !content
        ? "![image envoyée](" + imageDataUrl + ")"
        : imageDataUrl
          ? `${content}\n![image envoyée](${imageDataUrl})`
          : content;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: userContent,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingContent("");

    // Sent image understanding (vision)
    if (imageDataUrl) {
      const visionController = new AbortController();
      abortRef.current = visionController;
      try {
        const res = await fetch("/api/ai/vision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: content,
            image: imageDataUrl,
          }),
          signal: visionController.signal,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Vision failed");

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.content,
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch {
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Sorry, I could not analyze this image. / Désolé, impossible d'analyser cette image.",
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        setStreamingContent("");
        abortRef.current = null;
      }
      return;
    }

    // Image generation on demand (FR / EN / AR + /image command), incl. 3D style
    if (isImageRequest(content)) {
      const imageController = new AbortController();
      abortRef.current = imageController;
      try {
        const basePrompt = extractImagePrompt(content);
        const want3D = is3DRequest(content);
        const prompt = want3D ? with3DStyle(basePrompt) : basePrompt;
        const res = await fetch("/api/ai/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
          signal: imageController.signal,
        });

        if (!res.ok) throw new Error("Image generation failed");
        const data = await res.json();

        const caption = want3D ? `🎨 3D — ${basePrompt}` : `🎨 ${basePrompt}`;
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `${caption}\n![${basePrompt}](${data.url})`,
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch {
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Sorry, I could not generate the image. Please try again. / Désolé, impossible de générer l'image. Réessayez.",
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        setStreamingContent("");
        abortRef.current = null;
      }
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, stream: true }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("Failed to get response");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);
          if (data === "[DONE]") continue;

          try {
            const chunk = JSON.parse(data);
            if (chunk.type === "text" && chunk.content) {
              fullContent += chunk.content;
              setStreamingContent(fullContent);
            } else if (chunk.type === "error") {
              fullContent = `Error: ${chunk.error}`;
              setStreamingContent(fullContent);
            }
          } catch {
            // skip
          }
        }
      }

      if (fullContent) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: fullContent,
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // User cancelled
        if (streamingContent) {
          const assistantMessage: Message = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: streamingContent + "\n\n*(stopped)*",
            createdAt: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      } else {
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
      setStreamingContent("");
      abortRef.current = null;
    }
  }, [streamingContent]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // Build display messages: include streaming placeholder
  const displayMessages: Message[] = [...messages];
  if (streamingContent) {
    displayMessages.push({
      id: "streaming",
      role: "assistant",
      content: streamingContent,
      createdAt: new Date(),
    });
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <ChatArea
          messages={displayMessages}
          isLoading={isLoading && !streamingContent}
          autoSpeak={autoSpeak}
        />
        <CommandBar
          onSend={handleSend}
          disabled={isLoading}
          isStreaming={isLoading}
          onCancel={handleCancel}
          autoSpeak={autoSpeak}
          onToggleAutoSpeak={() => {
            if (autoSpeak && typeof window !== "undefined" && "speechSynthesis" in window) {
              window.speechSynthesis.cancel();
            }
            setAutoSpeak((v) => !v);
          }}
        />
      </main>
    </div>
  );
}
