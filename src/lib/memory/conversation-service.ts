import { prisma } from "@/lib/prisma";

export interface CreateConversationInput {
  userId: string;
  title?: string;
  model?: string;
}

export async function createConversation(input: CreateConversationInput) {
  return prisma.conversation.create({
    data: {
      userId: input.userId,
      title: input.title ?? "New Conversation",
      model: input.model,
    },
  });
}

export async function getConversations(userId: string, options?: { archived?: boolean; pinned?: boolean; category?: string }) {
  const where: Record<string, unknown> = { userId };
  if (options?.archived !== undefined) where.archived = options.archived;
  if (options?.pinned !== undefined) where.pinned = options.pinned;
  if (options?.category) where.category = options.category;

  return prisma.conversation.findMany({
    where,
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    include: { messages: { take: 1, orderBy: { createdAt: "desc" } } },
  });
}

export async function getConversation(id: string, userId: string) {
  return prisma.conversation.findFirst({
    where: { id, userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
}

export async function updateConversation(id: string, userId: string, data: { title?: string; pinned?: boolean; archived?: boolean; category?: string }) {
  return prisma.conversation.updateMany({ where: { id, userId }, data });
}

export async function deleteConversation(id: string, userId: string) {
  return prisma.conversation.deleteMany({ where: { id, userId } });
}

export async function addMessage(conversationId: string, role: string, content: string, metadata?: { toolCalls?: string; toolResults?: string; tokenCount?: number }) {
  const message = await prisma.message.create({
    data: { conversationId, role, content, ...metadata },
  });
  await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
  return message;
}

export async function getMessages(conversationId: string) {
  return prisma.message.findMany({ where: { conversationId }, orderBy: { createdAt: "asc" } });
}

export async function searchConversations(userId: string, query: string) {
  return prisma.conversation.findMany({
    where: { userId, title: { contains: query } },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });
}
