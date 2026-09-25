"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { User, Volume2, VolumeX } from "lucide-react";
import { KNIGHT_IMAGE_URL } from "@/lib/persona";
import type { Message } from "@/types";

interface ChatMessageProps {
  message: Message;
  autoSpeak?: boolean;
}

const IMAGE_MD_RE = /!\[([^\]]*)\]\(([^)]+)\)/g;

function detectLang(text: string): string {
  if (/[\u0600-\u06FF]/.test(text)) return "ar-SA";
  if (/[àâäéèêëîïôöùûüÿçœæ]/i.test(text)) return "fr-FR";
  if (typeof navigator !== "undefined" && navigator.language) {
    return navigator.language;
  }
  return "en-US";
}

function stripImages(text: string): string {
  return text.replace(IMAGE_MD_RE, "$1").trim();
}

function speakText(text: string, onEnd: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = detectLang(text);
  utterance.rate = 1;
  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  window.speechSynthesis.speak(utterance);
}

function renderContent(content: string) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  IMAGE_MD_RE.lastIndex = 0;

  while ((match = IMAGE_MD_RE.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`t-${lastIndex}`}>
          {content.slice(lastIndex, match.index)}
        </span>
      );
    }
    const alt = match[1] || "generated image";
    const url = match[2];
    parts.push(
      <a
        key={`img-${match.index}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block my-2"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={alt}
          className="rounded-xl max-w-full max-h-[420px] object-contain border border-zinc-700 bg-zinc-900"
          loading="lazy"
        />
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(
      <span key={`t-${lastIndex}`}>{content.slice(lastIndex)}</span>
    );
  }

  return parts.length > 0 ? parts : content;
}

export function ChatMessage({ message, autoSpeak = false }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [speaking, setSpeaking] = useState(false);
  const autoSpokenRef = useRef(false);

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  };

  const handleSpeak = () => {
    if (speaking) {
      stopSpeaking();
      return;
    }
    const text = stripImages(message.content);
    if (!text) return;
    setSpeaking(true);
    speakText(text, () => setSpeaking(false));
  };

  // "Laisse-le parler" mode: knight speaks every new response automatically
  useEffect(() => {
    if (!isUser && autoSpeak && !autoSpokenRef.current) {
      const text = stripImages(message.content);
      if (text && message.id !== "streaming") {
        autoSpokenRef.current = true;
        setSpeaking(true);
        speakText(text, () => setSpeaking(false));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message.content, autoSpeak]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const canSpeak =
    !isUser &&
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    stripImages(message.content).length > 0;

  return (
    <div
      className={cn(
        "flex gap-4 py-6 px-4",
        isUser ? "bg-transparent" : "bg-zinc-900/50"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden transition-all",
          isUser
            ? "bg-blue-600"
            : cn(
                "bg-gradient-to-br from-amber-600 to-yellow-800 border border-amber-500/40",
                speaking && "avatar-speaking"
              )
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={KNIGHT_IMAGE_URL}
            alt="Al-Qa'qa' — Arab knight"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-zinc-200">
            {isUser ? "You" : "Al-Qa'qa' ⚔️"}
          </span>
          {canSpeak && (
            <button
              onClick={handleSpeak}
              className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors"
              title={speaking ? "Stop reading aloud" : "Read aloud"}
            >
              {speaking ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
        <div className="text-sm text-zinc-300 whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed">
          {renderContent(message.content)}
        </div>
      </div>
    </div>
  );
}
