import type { UserRole } from "@prisma/client";

// -----------------------------------------------------------------------------
// Pure authorization decisions. Extracted from route handlers so the security-
// critical logic is unit-tested and reused, not duplicated inline.
// -----------------------------------------------------------------------------

// SECURITY: never trust a client-supplied role for privileged access. Self-
// provisioning may only pick PARENT or SITTER; anything else (incl. "ADMIN")
// collapses to PARENT. ADMIN is assigned out-of-band only.
export function resolveSelfProvisionRole(metadataRole: unknown): "PARENT" | "SITTER" {
  return metadataRole === "SITTER" ? "SITTER" : "PARENT";
}

export type Decision =
  | { ok: true }
  | { ok: false; status: number; error: string };

// Who may review whom: a job party may review the counterparty, once the job
// is COMPLETED. Prevents review fraud on throwaway jobs.
export function canReview(args: {
  job: { parentId: string; matchedSitterId: string | null; status: string } | null;
  userId: string;
  targetId: string;
}): Decision {
  const { job, userId, targetId } = args;
  if (!job) return { ok: false, status: 404, error: "JOB_NOT_FOUND" };

  const isParent = job.parentId === userId;
  const isSitter = job.matchedSitterId === userId;
  if (!isParent && !isSitter) return { ok: false, status: 403, error: "FORBIDDEN" };

  const counterpartyId = isParent ? job.matchedSitterId : job.parentId;
  if (!counterpartyId || counterpartyId !== targetId) {
    return { ok: false, status: 403, error: "INVALID_TARGET" };
  }
  if (job.status !== "COMPLETED") return { ok: false, status: 409, error: "JOB_NOT_COMPLETED" };
  return { ok: true };
}

// Given the creator's role, resolve which side is parent vs sitter and which
// role the counterparty must be. Returns null for a non-participant role.
export function resolveBookingSides(
  creatorRole: UserRole,
  creatorId: string,
  counterpartyId: string
): { parentId: string; sitterId: string; expectedCounterRole: "PARENT" | "SITTER" } | null {
  if (creatorRole === "PARENT") {
    return { parentId: creatorId, sitterId: counterpartyId, expectedCounterRole: "SITTER" };
  }
  if (creatorRole === "SITTER") {
    return { parentId: counterpartyId, sitterId: creatorId, expectedCounterRole: "PARENT" };
  }
  return null;
}

// Moderation guard: admins cannot suspend themselves or other admins.
export function canSuspend(actorId: string, target: { id: string; role: UserRole }): Decision {
  if (target.id === actorId) return { ok: false, status: 400, error: "CANNOT_SUSPEND_SELF" };
  if (target.role === "ADMIN") return { ok: false, status: 403, error: "CANNOT_SUSPEND_ADMIN" };
  return { ok: true };
}
