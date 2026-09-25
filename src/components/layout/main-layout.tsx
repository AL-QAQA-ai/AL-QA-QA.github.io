"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./sidebar";
import { CommandBar } from "@/components/chat/command-bar";
import { ChatArea } from "@/components/chat/chat-area";
import { runChat } from "@/lib/chat-client";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Voice ON by default (persisted): the knight answers aloud after the first tap.
  useEffect(() => {
    const stored = localStorage.getItem("autoSpeak");
    if (stored === null) {
      setAutoSpeak(true);
    } else {
      setAutoSpeak(stored === "true");
    }
  }, []);

  const toggleAutoSpeak = useCallback(() => {
    setAutoSpeak((v) => {
      const next = !v;
      localStorage.setItem("autoSpeak", String(next));
      if (!next && typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      return next;
    });
  }, []);

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
      abortRef.current = null;
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            max_tokens: 1024,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text:
                      content?.trim() ||
                      "Describe this image in detail, in the language the user seems to use.",
                  },
                  { type: "image_url", image_url: { url: imageDataUrl } },
                ],
              },
            ],
          }),
        });

        if (!res.ok) throw new Error("Vision failed");
        const data = await res.json();

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.choices?.[0]?.message?.content ?? "I could not analyze this image.",
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch {
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Vision requires an API key. / L'analyse d'image nécessite une clé API.",
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        setStreamingContent("");
      }
      return;
    }

    // Image generation on demand (FR / EN / AR + /image command), incl. 3D style
    if (isImageRequest(content)) {
      abortRef.current = null;
      try {
        const basePrompt = extractImagePrompt(content);
        const want3D = is3DRequest(content);
        const prompt = want3D ? with3DStyle(basePrompt) : basePrompt;
        const seed = Math.floor(Math.random() * 1_000_000);
        const url =
          `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
          `?width=1024&height=1024&seed=${seed}&nologo=true&model=flux`;

        const caption = want3D ? `🎨 3D — ${basePrompt}` : `🎨 ${basePrompt}`;
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `${caption}\n![${basePrompt}](${url})`,
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch {
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Sorry, I could not generate the image. / Désolé, impossible de générer l'image.",
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        setStreamingContent("");
      }
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let fullContent = "";

      for await (const chunk of runChat([{ role: "user", content }])) {
        if (controller.signal.aborted) break;
        if (chunk.type === "text" && chunk.content) {
          fullContent += chunk.content;
          setStreamingContent(fullContent);
        } else if (chunk.type === "error") {
          fullContent = `Error: ${chunk.error}`;
          setStreamingContent(fullContent);
        }
      }

      if (fullContent) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: controller.signal.aborted ? fullContent + "\n\n*(stopped)*" : fullContent,
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
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
    <div className="flex h-[100dvh] bg-zinc-950 text-zinc-100 overflow-hidden">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center gap-3 px-3 py-2 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-2 rounded-lg text-zinc-300 hover:bg-zinc-800 active:bg-zinc-700 transition-colors"
            title="Open menu"
            aria-label="Open menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">Q</span>
            </div>
            <span className="text-white font-semibold text-sm">AL-QAQA AI</span>
          </div>
        </header>

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
          onToggleAutoSpeak={toggleAutoSpeak}
        />
      </main>
    </div>
  );
}
