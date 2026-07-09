import { prisma } from '@/lib/db/prisma';
import type { AuditAction } from '@prisma/client';

/**
 * Record a sensitive action in the append-only audit log. Never store PHI
 * values here — only who/what/when metadata (docs/SECURITY_CHECKLIST.md §7).
 */
export async function recordAudit(params: {
  userId: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { userId, action, entityType, entityId, ip, userAgent, metadata } =
    params;
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType: entityType ?? null,
        entityId: entityId ?? null,
        ip: ip ?? null,
        userAgent: userAgent ?? null,
        metadata: metadata ? (metadata as object) : undefined,
      },
    });
  } catch {
    // Audit failures must never break the primary action; surface via logs.
    console.error('audit-log-write-failed', { action, entityType });
  }
}
