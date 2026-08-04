import { prisma } from "./prisma";
import { clientIp } from "./security";

// -----------------------------------------------------------------------------
// Append-only audit logging for sensitive actions. Best-effort: a logging
// failure must never break the primary action, so callers can `await audit(...)`
// safely (it swallows its own errors).
// -----------------------------------------------------------------------------

export type AuditAction =
  | "SETTINGS_UPDATED"
  | "VERIFICATION_APPROVED"
  | "VERIFICATION_REJECTED"
  | "SETTLEMENT_STATUS_CHANGED"
  | "REPORT_STATUS_CHANGED"
  | "USER_REPORTED"
  | "USER_BLOCKED"
  | "USER_UNBLOCKED";

export async function audit(params: {
  actorId?: string | null;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  req?: Request;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId ?? null,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: (params.metadata as object) ?? undefined,
        ip: params.req ? clientIp(params.req) : undefined,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[audit] failed", err);
  }
}
