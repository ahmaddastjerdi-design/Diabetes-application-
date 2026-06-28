/**
 * access.ts — patient-scoped access control (Vol 8 §authz, Vol 3/4 consent gating).
 *
 * The decision a clinician panel and every patient-data endpoint must make:
 * "may THIS actor touch THIS patient's data right now?". A clinician may only do so
 * through an ACTIVE, unrevoked consent linking them to the patient. Patients may only
 * reach their own record. This is the choke-point that makes PHI access lawful.
 */
import { hasPermission, type Role } from "./rbac.js";

export interface Actor {
  id: string;
  role: Role;
}

/** A patient's grant of access to a clinician (mirrors the `consents` table). */
export interface Consent {
  patientId: string;
  clinicianId: string;
  status: "active" | "revoked";
  grantedAt: number; // epoch ms
  revokedAt?: number;
}

export interface AccessDecision {
  allowed: boolean;
  reason: string;
}

/** Is there a live consent linking this clinician to this patient at time `now`? */
export function hasActiveConsent(
  clinicianId: string,
  patientId: string,
  consents: readonly Consent[],
  now: number
): boolean {
  return consents.some(
    (c) =>
      c.clinicianId === clinicianId &&
      c.patientId === patientId &&
      c.status === "active" &&
      c.grantedAt <= now &&
      (c.revokedAt === undefined || c.revokedAt > now)
  );
}

/**
 * The single access decision. Combines RBAC (role may do the action at all) with the
 * patient scope (ownership for patients, active consent for clinicians/nurses).
 */
export function decideAccess(
  actor: Actor,
  patientId: string,
  consents: readonly Consent[],
  now: number
): AccessDecision {
  if (actor.role === "admin") return { allowed: true, reason: "admin" };

  if (actor.role === "patient") {
    if (actor.id !== patientId) return { allowed: false, reason: "patients may only access their own record" };
    if (!hasPermission("patient", "read:own")) return { allowed: false, reason: "role lacks permission" };
    return { allowed: true, reason: "self" };
  }

  // clinician / nurse
  if (!hasPermission(actor.role, "read:patient")) return { allowed: false, reason: "role lacks permission" };
  if (!hasActiveConsent(actor.id, patientId, consents, now))
    return { allowed: false, reason: "no active patient consent" };
  return { allowed: true, reason: "consent" };
}
