import { prisma } from "@/lib/prisma";

export interface CreateMemoryInput {
  userId: string;
  key: string;
  value: string;
  category?: string;
  project?: string;
}

export async function createMemory(input: CreateMemoryInput) {
  return prisma.memory.upsert({
    where: { userId_key: { userId: input.userId, key: input.key } },
    update: { value: input.value, category: input.category, project: input.project },
    create: {
      userId: input.userId,
      key: input.key,
      value: input.value,
      category: input.category ?? "general",
      project: input.project,
    },
  });
}

export async function getMemories(
  userId: string,
  filters?: { category?: string; project?: string; search?: string }
) {
  const where: Record<string, unknown> = { userId };
  if (filters?.category) where.category = filters.category;
  if (filters?.project) where.project = filters.project;
  if (filters?.search) {
    where.OR = [
      { key: { contains: filters.search } },
      { value: { contains: filters.search } },
    ];
  }
  return prisma.memory.findMany({ where, orderBy: { updatedAt: "desc" } });
}

export async function getMemory(id: string, userId: string) {
  return prisma.memory.findFirst({ where: { id, userId } });
}

export async function updateMemory(id: string, userId: string, data: { value?: string; category?: string }) {
  return prisma.memory.updateMany({ where: { id, userId }, data });
}

export async function deleteMemory(id: string, userId: string) {
  return prisma.memory.deleteMany({ where: { id, userId } });
}

export async function deleteAllMemories(userId: string, category?: string) {
  const where: Record<string, unknown> = { userId };
  if (category) where.category = category;
  return prisma.memory.deleteMany({ where });
}
