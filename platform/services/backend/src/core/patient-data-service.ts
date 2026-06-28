/**
 * patient-data-service.ts — the application service that composes the Phase-1 core:
 * access decision -> audit -> action. Every read/write of patient data goes through
 * here so that authorization and audit can never be accidentally bypassed (Vol 4/8).
 */
import { decideAccess, type Actor } from "./auth/access.js";
import { dedupeEvents } from "./sync/merge.js";
import { deriveProgress, levelFromXp, type DomainEvent } from "./progress.js";
import type { ConsentRepo, EventRepo, AuditRepo, StoredEvent } from "./repositories.js";

export class AccessDeniedError extends Error {
  constructor(public readonly reason: string) {
    super(`access denied: ${reason}`);
    this.name = "AccessDeniedError";
  }
}

export interface PatientDataDeps {
  consents: ConsentRepo;
  events: EventRepo;
  audit: AuditRepo;
}

export class PatientDataService {
  constructor(private readonly deps: PatientDataDeps) {}

  /** Authorize `actor` for `patientId` at `now`, writing an audit record either way. */
  private async authorize(actor: Actor, patientId: string, action: string, now: number): Promise<void> {
    const consents = await this.deps.consents.forPatient(patientId);
    const decision = decideAccess(actor, patientId, consents, now);
    await this.deps.audit.append({
      actorId: actor.id,
      action: `${action}:${decision.allowed ? "allow" : "deny"}`,
      target: `Patient/${patientId}`,
      occurredAt: now,
    });
    if (!decision.allowed) throw new AccessDeniedError(decision.reason);
  }

  /** Read a patient's authoritative, server-derived progress (consent-gated + audited). */
  async getProgress(actor: Actor, patientId: string, now: number) {
    await this.authorize(actor, patientId, "read:progress", now);
    const events = await this.deps.events.forPatient(patientId);
    const progress = deriveProgress(events);
    return { ...progress, level: levelFromXp(progress.xp) };
  }

  /** Ingest a batch of offline events idempotently, then return fresh progress. */
  async syncEvents(
    actor: Actor,
    patientId: string,
    incoming: { id: string; event: DomainEvent }[],
    now: number
  ) {
    await this.authorize(actor, patientId, "write:events", now);
    const seen = await this.deps.events.seenIds(patientId);
    const fresh = dedupeEvents(seen, incoming);
    const toStore: StoredEvent[] = fresh.map((f) => ({ id: f.id, patientId, event: f.event }));
    await this.deps.events.append(toStore);
    const events = await this.deps.events.forPatient(patientId);
    const progress = deriveProgress(events);
    return { accepted: fresh.length, duplicates: incoming.length - fresh.length, ...progress };
  }
}
