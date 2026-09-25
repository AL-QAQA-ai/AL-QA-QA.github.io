import { prisma } from "@/lib/prisma";

export interface AuditLogEntry {
  userId?: string;
  action: string;
  tool?: string;
  agent?: string;
  target?: string;
  result?: string;
  status?: "success" | "failure" | "error";
  metadata?: Record<string, unknown>;
}

export async function logAudit(entry: AuditLogEntry) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        tool: entry.tool,
        agent: entry.agent,
        target: entry.target,
        result: entry.result,
        status: entry.status ?? "success",
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      },
    });
  } catch (error) {
    console.error("[Audit Log Error]", error);
  }
}

export async function getAuditLogs(
  userId: string,
  options?: { limit?: number; offset?: number; action?: string }
) {
  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;
  if (options?.action) where.action = options.action;

  return prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 50,
    skip: options?.offset ?? 0,
  });
}
