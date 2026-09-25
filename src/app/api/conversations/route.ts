import { NextResponse } from "next/server";
import { createConversation, getConversations, searchConversations } from "@/lib/memory";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const query = searchParams.get("q");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  if (query) {
    const results = await searchConversations(userId, query);
    return NextResponse.json(results);
  }

  const conversations = await getConversations(userId, {
    archived: searchParams.get("archived") === "true",
  });
  return NextResponse.json(conversations);
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const conversation = await createConversation({
    userId: body.userId,
    title: body.title,
    model: body.model,
  });

  return NextResponse.json(conversation, { status: 201 });
}
