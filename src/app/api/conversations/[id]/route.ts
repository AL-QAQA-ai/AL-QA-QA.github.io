import { NextResponse } from "next/server";
import { getConversation, updateConversation, deleteConversation } from "@/lib/memory";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(_request.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const conversation = await getConversation(id, userId);
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(conversation);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  if (!body.userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  await updateConversation(id, body.userId, {
    title: body.title,
    pinned: body.pinned,
    archived: body.archived,
    category: body.category,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  await deleteConversation(id, userId);
  return NextResponse.json({ ok: true });
}
