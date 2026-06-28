/**
 * repositories.pg.ts — Postgres adapters for the domain ports (Vol 4 §database).
 * Implement the same interfaces as the in-memory repos in core/repositories.ts, so the
 * application service is identical whether backed by memory (tests) or Postgres (prod).
 */
import type {
  ConsentRepo,
  EventRepo,
  AuditRepo,
  StoredEvent,
  Consent,
  DomainEvent,
  AuditEntry,
  AuditRecord,
} from "../core/index.js";
import { chainHash } from "../core/index.js";
import { pool } from "./db.js";

export class PgConsentRepo implements ConsentRepo {
  async forPatient(patientId: string): Promise<Consent[]> {
    const { rows } = await pool.query(
      "SELECT patient_id, clinician_id, status, granted_at, revoked_at FROM consents WHERE patient_id = $1",
      [patientId]
    );
    return rows.map((r) => ({
      patientId: r.patient_id,
      clinicianId: r.clinician_id,
      status: r.status,
      grantedAt: Number(r.granted_at),
      revokedAt: r.revoked_at === null ? undefined : Number(r.revoked_at),
    }));
  }
  async grant(c: Consent): Promise<void> {
    await pool.query(
      "INSERT INTO consents (patient_id, clinician_id, status, granted_at, revoked_at) VALUES ($1,$2,$3,$4,$5)",
      [c.patientId, c.clinicianId, c.status, c.grantedAt, c.revokedAt ?? null]
    );
  }
  async revoke(patientId: string, clinicianId: string, at: number): Promise<void> {
    await pool.query(
      "UPDATE consents SET status='revoked', revoked_at=$3 WHERE patient_id=$1 AND clinician_id=$2 AND status='active'",
      [patientId, clinicianId, at]
    );
  }
}

export class PgEventRepo implements EventRepo {
  async seenIds(patientId: string): Promise<Set<string>> {
    const { rows } = await pool.query("SELECT idem_key FROM domain_events WHERE patient_id = $1", [patientId]);
    return new Set(rows.map((r) => r.idem_key as string));
  }
  async append(events: StoredEvent[]): Promise<void> {
    if (events.length === 0) return;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const e of events) {
        // ON CONFLICT makes append idempotent even under a concurrent duplicate sync.
        await client.query(
          "INSERT INTO domain_events (patient_id, idem_key, type, payload) VALUES ($1,$2,$3,$4) ON CONFLICT (patient_id, idem_key) DO NOTHING",
          [e.patientId, e.id, (e.event as { type: string }).type, JSON.stringify(e.event)]
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
  async forPatient(patientId: string): Promise<DomainEvent[]> {
    const { rows } = await pool.query(
      "SELECT payload FROM domain_events WHERE patient_id = $1 ORDER BY seq ASC",
      [patientId]
    );
    return rows.map((r) => r.payload as DomainEvent);
  }
}

export class PgAuditRepo implements AuditRepo {
  async append(entry: AuditEntry): Promise<AuditRecord> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query("SELECT hash FROM audit_log ORDER BY seq DESC LIMIT 1");
      const prevHash: string | null = rows.length ? rows[0].hash : null;
      const hash = chainHash(prevHash, entry);
      const inserted = await client.query(
        "INSERT INTO audit_log (actor_id, action, target, occurred_at, prev_hash, hash) VALUES ($1,$2,$3,$4,$5,$6) RETURNING seq",
        [entry.actorId, entry.action, entry.target, entry.occurredAt, prevHash, hash]
      );
      await client.query("COMMIT");
      return { ...entry, seq: Number(inserted.rows[0].seq), prevHash, hash };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
  async all(): Promise<AuditRecord[]> {
    const { rows } = await pool.query(
      "SELECT seq, actor_id, action, target, occurred_at, prev_hash, hash FROM audit_log ORDER BY seq ASC"
    );
    return rows.map((r) => ({
      seq: Number(r.seq),
      actorId: r.actor_id,
      action: r.action,
      target: r.target,
      occurredAt: Number(r.occurred_at),
      prevHash: r.prev_hash,
      hash: r.hash,
    }));
  }
}
