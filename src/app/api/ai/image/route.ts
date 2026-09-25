import { NextResponse } from "next/server";
import { z } from "zod";

const imageSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty").max(1000, "Prompt too long"),
  width: z.number().min(256).max(2048).optional(),
  height: z.number().min(256).max(2048).optional(),
});

// Image generation without API key, via Pollinations (free, no key required).
// The returned URL generates the image on demand.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = imageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { prompt, width = 1024, height = 1024 } = parsed.data;
    const seed = Math.floor(Math.random() * 1_000_000);
    const url =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
      `?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;

    return NextResponse.json({ url, prompt, seed });
  } catch (error) {
    console.error("[Image API Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
