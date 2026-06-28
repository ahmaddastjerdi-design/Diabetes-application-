/**
 * patient-data-service.ts — the application service that composes the Phase-1 core:
 * access decision -> audit -> action. Every read/write of patient data goes through
 * here so that authorization and audit can never be accidentally bypassed (Vol 4/8).
 */
import type { Observation } from "@diabetes-quest/shared";
import { decideAccess, type Actor } from "./auth/access.js";
import { dedupeEvents } from "./sync/merge.js";
import { idempotencyKey } from "./observations.js";
import { deriveProgress, levelFromXp, type DomainEvent } from "./progress.js";
import type {
  ConsentRepo,
  EventRepo,
  AuditRepo,
  StoredEvent,
  ObservationRepo,
  EscalationRepo,
  StoredObservation,
} from "./repositories.js";

/** Plain coach-grounding payload (matches the AI coach's GroundingData shape, Vol 6). */
export interface CoachContextPayload {
  recentMarkers: { label: string; value: number; unit: string; status: string }[];
  lessonsCompleted: string[];
}

/** Simple status for a glucose value (consensus 70–180 in-range; outer bands escalate). */
function glucoseStatus(v: number): string {
  if (v >= 70 && v <= 180) return "in-range";
  if (v >= 54 && v <= 250) return "borderline";
  return "out-of-range";
}

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
  observations?: ObservationRepo;
  escalations?: EscalationRepo;
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

  private requireObservations(): ObservationRepo {
    if (!this.deps.observations) throw new Error("observation repository not configured");
    return this.deps.observations;
  }

  /** Persist a validated FHIR Observation idempotently (consent-gated + audited). */
  async addObservation(actor: Actor, patientId: string, fhir: Observation, now: number) {
    await this.authorize(actor, patientId, "write:observation", now);
    const repo = this.requireObservations();
    const key = idempotencyKey(fhir);
    const seen = await repo.seenKeys(patientId);
    const deduped = seen.has(key);
    if (!deduped) {
      const row: StoredObservation = { patientId, idempotencyKey: key, fhir, effectiveAtMs: Date.parse(fhir.effectiveDateTime) };
      await repo.append([row]);
    }
    return { id: key, deduped };
  }

  /**
   * First-party ingest from the device pipeline (Vol 5). The data subject is the patient
   * in the Observation, so no clinician consent is required — but it is still audited.
   */
  async ingestObservation(patientId: string, fhir: Observation, now: number) {
    const repo = this.requireObservations();
    const key = idempotencyKey(fhir);
    const deduped = (await repo.seenKeys(patientId)).has(key);
    if (!deduped) {
      await repo.append([{ patientId, idempotencyKey: key, fhir, effectiveAtMs: Date.parse(fhir.effectiveDateTime) }]);
    }
    await this.deps.audit.append({ actorId: "device-gateway", action: "ingest:observation", target: `Patient/${patientId}`, occurredAt: now });
    return { id: key, deduped };
  }

  /** Read a patient's observation timeline (consent-gated + audited). */
  async listObservations(actor: Actor, patientId: string, now: number): Promise<Observation[]> {
    await this.authorize(actor, patientId, "read:observations", now);
    const rows = await this.requireObservations().forPatient(patientId);
    return rows.map((r) => r.fhir);
  }

  /** Assemble the AI coach's grounding context from real data (consent-gated + audited). */
  async getCoachContext(actor: Actor, patientId: string, now: number): Promise<CoachContextPayload> {
    await this.authorize(actor, patientId, "read:coach-context", now);
    const rows = await this.requireObservations().forPatient(patientId);
    // latest reading per LOINC code
    const latest = new Map<string, StoredObservation>();
    for (const r of rows) {
      const code = r.fhir.code.coding[0]?.code ?? "?";
      const prev = latest.get(code);
      if (!prev || r.effectiveAtMs > prev.effectiveAtMs) latest.set(code, r);
    }
    const recentMarkers = [...latest.values()].map((r) => {
      const q = r.fhir.valueQuantity;
      const label = r.fhir.code.coding[0]?.display ?? "Reading";
      const status = q.unit === "mg/dL" ? glucoseStatus(q.value) : "recorded";
      return { label, value: q.value, unit: q.unit, status };
    });
    const events = await this.deps.events.forPatient(patientId);
    const lessonsCompleted = events
      .filter((e): e is Extract<DomainEvent, { type: "lesson_completed" }> => e.type === "lesson_completed")
      .map((e) => e.lessonId);
    return { recentMarkers, lessonsCompleted };
  }

  /** Record a care-team escalation raised by the AI coach (audited). */
  async recordEscalation(
    actor: Actor,
    patientId: string,
    escalation: { tier: string; audience: string; notifyCareTeam: boolean; instruction: string },
    now: number
  ) {
    await this.authorize(actor, patientId, "write:escalation", now);
    if (!this.deps.escalations) throw new Error("escalation repository not configured");
    await this.deps.escalations.record({ patientId, ...escalation, atMs: now });
    return { recorded: true };
  }
}
