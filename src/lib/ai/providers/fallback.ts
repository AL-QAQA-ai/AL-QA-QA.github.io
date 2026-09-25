import type {
  AIProvider,
  AICompletionRequest,
  AICompletionResponse,
  AIStreamChunk,
} from "../types";

export class FallbackProvider implements AIProvider {
  readonly name = "fallback";
  readonly isConfigured = true;

  getAvailableModels(): string[] {
    return ["fallback-local"];
  }

  async validate(): Promise<boolean> {
    return true;
  }

  async chat(request: AICompletionRequest): Promise<AICompletionResponse> {
    const lastUser = [...request.messages]
      .reverse()
      .find((m) => m.role === "user");
    const content = this.generateResponse(lastUser?.content ?? "");

    return {
      content,
      model: "fallback-local",
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      finishReason: "stop",
    };
  }

  async *stream(
    request: AICompletionRequest
  ): AsyncGenerator<AIStreamChunk, void, unknown> {
    const lastUser = [...request.messages]
      .reverse()
      .find((m) => m.role === "user");
    const content = this.generateResponse(lastUser?.content ?? "");

    // Simulate streaming by yielding one word at a time
    const words = content.split(" ");
    for (let i = 0; i < words.length; i++) {
      yield {
        type: "text",
        content: (i === 0 ? "" : " ") + words[i],
      };
      // Small delay to simulate streaming
      await new Promise((r) => setTimeout(r, 20));
    }
    yield { type: "done" };
  }

  private detectLang(text: string): "ar" | "fr" | "en" {
    if (/[\u0600-\u06FF]/.test(text)) return "ar";
    if (/[àâäéèêëîïôöùûüÿçœæ]/i.test(text)) return "fr";
    if (/\b(que|quoi|comment|pourquoi|quelle|solution|résoudre|resoudre|expliquer|bonjour|salut|merci)\b/i.test(text)) return "fr";
    return "en";
  }

  private tryEvaluateMath(text: string): string | null {
    const match = text.match(/([-+*/().%\d\s^]+)/);
    if (!match) return null;
    const expr = match[1].trim().replace(/\^/g, "**");
    if (!/^[-+*/().%\d\s*]+$/.test(expr) || !/\d/.test(expr)) return null;
    if (expr.replace(/[\s\d.+\-*/()%]/g, "").length > 0) return null;
    try {
      // eslint-disable-next-line no-eval
      const result = Function(`"use strict"; return (${expr})`)();
      if (typeof result !== "number" || !isFinite(result)) return null;
      return String(Math.round(result * 10000) / 10000);
    } catch {
      return null;
    }
  }

  private isSolutionRequest(lower: string): boolean {
    return /solution|solve|résoudre|resoudre|calculer|calculate|expliquer|explain|اشرح|حل|problème|probleme|problem|exercise|exercice|تمرين|مسألة|equation|équation|معادلة|how to|comment/.test(lower);
  }

  private solutionGuide(lang: "ar" | "fr" | "en", question: string, computed: string | null): string {
    const header =
      lang === "ar"
        ? `## منهجية الحل\n\n**المسألة:** ${question}`
        : lang === "fr"
          ? `## Méthode de résolution\n\n**Problème :** ${question}`
          : `## Solution method\n\n**Problem:** ${question}`;
    const steps =
      lang === "ar"
        ? `\n\n1. **المعطيات:** حدّد ما هو معلوم وما هو مطلوب\n2. **القانون:** استحضر القاعدة أو الصيغة المناسبة\n3. **التطبيق:** عوّض بالأرقام مع الوحدات في كل خطوة\n4. **التحقق:** تأكد من الوحدات والرتبة العددية للنتيجة`
        : lang === "fr"
          ? `\n\n1. **Données :** sépare ce qui est connu de ce qui est cherché\n2. **Loi/formule :** rappelle la règle ou la formule adaptée\n3. **Application :** remplace par les nombres, avec les unités à chaque étape\n4. **Vérification :** contrôle les unités et l'ordre de grandeur du résultat`
          : `\n\n1. **Given/Find:** separate knowns from unknowns\n2. **Principle:** recall the matching law or formula\n3. **Apply:** substitute numbers, keep units at every step\n4. **Check:** verify units and order of magnitude`;
    const resultLine =
      computed !== null
        ? lang === "ar"
          ? `\n\n**نتيجة الحساب المباشر:** ${computed}`
          : lang === "fr"
            ? `\n\n**Résultat du calcul direct :** ${computed}`
            : `\n\n**Direct computation result:** ${computed}`
        : "";
    const footer =
      lang === "ar"
        ? `\n\n---\n*وضع محدود: أضف مفتاح OPENAI_API_KEY في .env للحصول على حلول كاملة ومفصلة.*`
        : lang === "fr"
          ? `\n\n---\n*Mode limité : ajoutez OPENAI_API_KEY dans .env pour des solutions complètes et détaillées.*`
          : `\n\n---\n*Limited mode: add OPENAI_API_KEY to .env for full detailed solutions.*`;
    return header + steps + resultLine + footer;
  }

  private generateResponse(userMessage: string): string {
    const lower = userMessage.toLowerCase();

    if (!userMessage.trim()) {
      return "How can I help you today? / Comment puis-je vous aider ? / كيف يمكنني مساعدتك؟";
    }

    if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey") || lower.includes("bonjour") || lower.includes("salut") || lower.includes("مرحبا") || lower.includes("سلام")) {
      return "Hello! / Bonjour ! / مرحباً!\n\nI'm AL-QA'QA' AI — I cover all sciences and all technologies, and I give structured solutions on demand. Ask me in any language, by voice or text. Note: I'm in limited mode (no AI provider key). Add OPENAI_API_KEY in .env for full capabilities.";
    }

    if (lower.includes("who are you") || lower.includes("what are you") || lower.includes("qui es") || lower.includes("من أنت")) {
      return "I'm AL-QA'QA' AI — an advanced multi-language, multi-modal AI assistant: all sciences, all technologies, step-by-step solutions, image creation (even 3D style), image analysis. Currently in limited mode — configure an AI provider (OpenAI, Anthropic) in .env to unlock full capabilities.";
    }

    if (lower.includes("help") || lower.includes("aide") || lower.includes("مساعدة")) {
      return "Here's what I can do / Ce que je peux faire / ما يمكنني فعله :\n\n- **Sciences & Tech**: math, physics, chemistry, biology, engineering + structured solutions\n- **Coding**: write, debug, review code\n- **Images**: create on demand (add '3D' for 3D style), analyze sent images\n- **Voice**: dictate with 🎤, listen with 🔊\n- **Writing & Research**: articles, translations, analysis\n\nLimited mode now — add OPENAI_API_KEY in .env for full AI.";
    }

    if (lower.includes("settings") || lower.includes("configure") || lower.includes("api key") || lower.includes("clé")) {
      return "To unlock full AI:\n\n1. Open the **.env** file in the project folder\n2. Set `OPENAI_API_KEY=your_key` (or ANTHROPIC_API_KEY)\n3. Restart the server (`npm run dev`)\n\nPour débloquer toute l'IA : mettez votre clé dans .env puis redémarrez.";
    }

    if (this.isSolutionRequest(lower)) {
      const lang = this.detectLang(userMessage);
      const computed = this.tryEvaluateMath(userMessage);
      return this.solutionGuide(lang, userMessage.trim().slice(0, 300), computed);
    }

    const computed = this.tryEvaluateMath(userMessage);
    if (computed !== null) {
      const lang = this.detectLang(userMessage);
      return this.solutionGuide(lang, userMessage.trim().slice(0, 300), computed);
    }

    return `I received your message: "${userMessage}"\n\nI'm currently running in **limited mode** (no AI provider key). Add OPENAI_API_KEY to .env and restart for full AI answers.\n\nJe fonctionne en **mode limité**. Ajoutez votre clé API dans .env et redémarrez pour des réponses IA complètes.`;
  }
}
