import { NextResponse } from "next/server";
import { createMemory, getMemories, deleteAllMemories } from "@/lib/memory";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const memories = await getMemories(userId, {
    category: searchParams.get("category") ?? undefined,
    project: searchParams.get("project") ?? undefined,
    search: searchParams.get("q") ?? undefined,
  });

  return NextResponse.json(memories);
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.userId || !body.key || !body.value) {
    return NextResponse.json({ error: "userId, key, and value required" }, { status: 400 });
  }

  const memory = await createMemory(body);
  return NextResponse.json(memory, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  await deleteAllMemories(userId, searchParams.get("category") ?? undefined);
  return NextResponse.json({ ok: true });
}
