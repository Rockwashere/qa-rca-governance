import { Prisma } from "@prisma/client";
import prisma from "./prisma";

export type AuditAction =
  | "CODE_CREATED"
  | "CODE_APPROVED"
  | "CODE_APPROVED_WITH_EDITS"
  | "CODE_REJECTED"
  | "CODE_MERGED"
  | "CODE_DEPRECATED"
  | "CODE_EDITED"
  | "PROPOSAL_CREATED"
  | "PROPOSAL_EDITED"
  | "PROPOSAL_DELETED"
  | "PROPOSAL_APPROVED"
  | "PROPOSAL_APPROVED_WITH_EDITS"
  | "PROPOSAL_REJECTED"
  | "PROPOSAL_MERGED"
  | "PROPOSAL_DEPRECATED"
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_ROLE_CHANGED"
  | "USER_DEACTIVATED"
  | "USER_ACTIVATED"
  | "COMMENT_ADDED";

export async function createAuditLog(params: {
  action: AuditAction;
  entityType: string;
  entityId: string;
  actorId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}) {
  return prisma.auditLog.create({
    data: {
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      actorId: params.actorId,
      // Prisma JSON fields: use Prisma.JsonNull instead of plain null
      before: (params.before ?? Prisma.JsonNull) as any,
      after: (params.after ?? Prisma.JsonNull) as any,
    },
  });
}

export function sanitizeForAudit(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = { ...obj };
  // Remove sensitive fields
  delete sanitized.password;
  // Convert dates to ISO strings
  for (const key of Object.keys(sanitized)) {
    if (sanitized[key] instanceof Date) {
      sanitized[key] = (sanitized[key] as Date).toISOString();
    }
  }
  return sanitized;
}
