import { NextResponse } from "next/server";
import { z } from "zod";

const visionSchema = z.object({
  prompt: z.string().max(2000).optional(),
  image: z
    .string()
    .min(1, "Image is required")
    .max(12_000_000, "Image too large")
    .refine(
      (v) => v.startsWith("data:image/"),
      "Image must be a data URL (image/*)"
    ),
});

const FALLBACK_REPLY = `I received your image, but image understanding requires an AI vision API key.

J'ai bien reçu votre image, mais sa compréhension nécessite une clé API vision (ex. OPENAI_API_KEY dans .env, puis redémarrez le serveur).

.استلمت صورتك، لكن فهم الصور يتطلب مفتاح API للرؤية (OPENAI_API_KEY في ملف .env ثم أعد تشغيل الخادم)`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = visionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY ?? "";
    if (!apiKey) {
      return NextResponse.json({ content: FALLBACK_REPLY, vision: false });
    }

    const { prompt, image } = parsed.data;
    const question =
      prompt?.trim() ||
      "Describe this image in detail, in the same language the user seems to use. / Décris cette image en détail dans la langue de l'utilisateur.";

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: question },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Vision API error: ${res.status} ${JSON.stringify(err)}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const content: string =
      data.choices?.[0]?.message?.content ??
      "I could not analyze this image.";

    return NextResponse.json({ content, vision: true });
  } catch (error) {
    console.error("[Vision API Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
