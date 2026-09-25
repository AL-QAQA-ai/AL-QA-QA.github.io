"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "./chat-message";
import { KNIGHT_IMAGE_URL, KNIGHT_GREETING } from "@/lib/persona";
import type { Message } from "@/types";

interface ChatAreaProps {
  messages: Message[];
  isLoading?: boolean;
  autoSpeak?: boolean;
}

export function ChatArea({ messages, isLoading, autoSpeak = false }: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center overflow-y-auto">
        <div className="text-center max-w-md px-4 py-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={KNIGHT_IMAGE_URL}
            alt="Al-Qa'qa' — historical Arab knight with his sword on his Arabian horse"
            className="knight-animated w-44 h-44 sm:w-48 sm:h-48 mx-auto mb-4 rounded-2xl object-cover border-2 border-amber-500/50"
          />
          <h2 className="text-xl font-semibold text-zinc-100 mb-2">
            Al-Qa&apos;qa&apos; ⚔️
          </h2>
          <p className="text-sm text-zinc-300 mb-1">{KNIGHT_GREETING.fr}</p>
          <p className="text-sm text-zinc-500 mb-1">{KNIGHT_GREETING.en}</p>
          <p className="text-sm text-zinc-500" dir="rtl">{KNIGHT_GREETING.ar}</p>
          <p className="text-xs text-zinc-600 mt-3">
            🎤 Dicte au micro • 🔊 Laisse-le parler • 📎 Envoie une image • 🎨 Demande une image 3D
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} autoSpeak={autoSpeak} />
        ))}
        {isLoading && (
          <div className="flex gap-4 py-6 px-4 bg-zinc-900/50">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-zinc-200">
                AL-QA&apos;QA&apos; AI
              </span>
              <div className="mt-2 flex items-center gap-1">
                <div className="w-2 h-2 bg-zinc-500 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-zinc-500 rounded-full animate-pulse [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-zinc-500 rounded-full animate-pulse [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
