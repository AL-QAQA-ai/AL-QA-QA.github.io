"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Mic, Square, Image as ImageIcon, X, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandBarProps {
  onSend: (message: string, imageDataUrl?: string) => void;
  disabled?: boolean;
  isStreaming?: boolean;
  onCancel?: () => void;
  autoSpeak?: boolean;
  onToggleAutoSpeak?: () => void;
}

export function CommandBar({
  onSend,
  disabled = false,
  isStreaming = false,
  onCancel,
  autoSpeak = false,
  onToggleAutoSpeak,
}: CommandBarProps) {
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [input]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.();
    };
  }, []);

  const handleSubmit = () => {
    if ((!input.trim() && !attachedImage) || disabled) return;
    onSend(input.trim(), attachedImage ?? undefined);
    setInput("");
    setAttachedImage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop?.();
      setListening(false);
      return;
    }

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.lang =
      (typeof navigator !== "undefined" && navigator.language) || "fr-FR";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  const handleAttachClick = () => {
    fileRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 4 * 1024 * 1024) return; // 4 MB max

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const insertImageCommand = () => {
    setInput((prev) => (prev ? `${prev} /image ` : "/image "));
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t border-zinc-800 bg-zinc-950 p-4">
      <div className="max-w-3xl mx-auto">
        {attachedImage && (
          <div className="mb-2 flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attachedImage}
              alt="attached"
              className="h-16 w-16 rounded-lg object-cover border border-zinc-700"
            />
            <span className="text-xs text-zinc-400">
              Image attached — ask anything about it
            </span>
            <button
              onClick={() => setAttachedImage(null)}
              className="p-1 text-zinc-400 hover:text-zinc-200"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="relative flex items-end gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-2 focus-within:border-blue-500/50">
          <button
            onClick={handleAttachClick}
            className="p-2 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Send an image for analysis"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message AL-QAQA AI... (voice, text, images)"
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent text-zinc-100 placeholder:text-zinc-500 text-sm resize-none focus:outline-none py-2 max-h-[200px]"
          />

          <button
            onClick={insertImageCommand}
            className="p-2 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Create an image (/image ...)"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {onToggleAutoSpeak && (
            <button
              onClick={onToggleAutoSpeak}
              className={cn(
                "p-2 transition-colors",
                autoSpeak
                  ? "text-amber-400"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
              title={autoSpeak ? "Laisse-le parler : ON (clique pour couper)" : "Laisse-le parler : l'IA parle à voix haute"}
            >
              {autoSpeak ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </button>
          )}

          {speechSupported && (
            <button
              onClick={toggleListening}
              className={cn(
                "p-2 transition-colors",
                listening
                  ? "text-red-400 animate-pulse"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
              title={listening ? "Stop dictation" : "Voice dictation (all languages)"}
            >
              <Mic className="w-5 h-5" />
            </button>
          )}

          {isStreaming ? (
            <button
              onClick={onCancel}
              className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              title="Stop generating"
            >
              <Square className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={(!input.trim() && !attachedImage) || disabled}
              className={cn(
                "p-2 rounded-lg transition-colors",
                (input.trim() || attachedImage) && !disabled
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              )}
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </div>
        <p className="text-xs text-zinc-600 text-center mt-2">
          AL-QA&apos;QA&apos; AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
}
