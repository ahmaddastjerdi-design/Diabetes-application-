/**
 * repositories.ts — persistence ports + in-memory adapters (Vol 4 §database).
 *
 * The domain depends on these INTERFACES, not on Postgres. The in-memory adapters here
 * are real implementations used by unit tests and local dev; the Postgres adapters live
 * in src/infra/ (which needs `pg`). This keeps the core verifiable without a database
 * and makes the access-control flow testable end-to-end.
 */
import type { Consent } from "./auth/access.js";
import type { DomainEvent } from "./progress.js";
import type { AuditEntry, AuditRecord } from "./audit/chain.js";
import { appendEntry } from "./audit/chain.js";

export interface ConsentRepo {
  forPatient(patientId: string): Promise<Consent[]>;
  grant(consent: Consent): Promise<void>;
  revoke(patientId: string, clinicianId: string, at: number): Promise<void>;
}

export interface StoredEvent {
  id: string; // idempotency key
  patientId: string;
  event: DomainEvent;
}

export interface EventRepo {
  seenIds(patientId: string): Promise<Set<string>>;
  append(events: StoredEvent[]): Promise<void>;
  forPatient(patientId: string): Promise<DomainEvent[]>;
}

export interface AuditRepo {
  append(entry: AuditEntry): Promise<AuditRecord>;
  all(): Promise<AuditRecord[]>;
}

// ---- In-memory adapters (tests / local dev) ----

export class InMemoryConsentRepo implements ConsentRepo {
  private rows: Consent[] = [];
  async forPatient(patientId: string): Promise<Consent[]> {
    return this.rows.filter((c) => c.patientId === patientId);
  }
  async grant(consent: Consent): Promise<void> {
    this.rows.push(consent);
  }
  async revoke(patientId: string, clinicianId: string, at: number): Promise<void> {
    this.rows = this.rows.map((c) =>
      c.patientId === patientId && c.clinicianId === clinicianId && c.status === "active"
        ? { ...c, status: "revoked", revokedAt: at }
        : c
    );
  }
}

export class InMemoryEventRepo implements EventRepo {
  private rows: StoredEvent[] = [];
  async seenIds(patientId: string): Promise<Set<string>> {
    return new Set(this.rows.filter((r) => r.patientId === patientId).map((r) => r.id));
  }
  async append(events: StoredEvent[]): Promise<void> {
    this.rows.push(...events);
  }
  async forPatient(patientId: string): Promise<DomainEvent[]> {
    return this.rows.filter((r) => r.patientId === patientId).map((r) => r.event);
  }
}

export class InMemoryAuditRepo implements AuditRepo {
  private log: AuditRecord[] = [];
  async append(entry: AuditEntry): Promise<AuditRecord> {
    const rec = appendEntry(this.log, entry);
    this.log.push(rec);
    return rec;
  }
  async all(): Promise<AuditRecord[]> {
    return [...this.log];
  }
}
