/**
 * backend.integration.test.mjs — Phase-1 flow against a REAL Postgres (Vol 9 §integration).
 * Runs in CI with a postgres service container; skips locally when DATABASE_URL is unset.
 * Exercises the Pg repositories through PatientDataService — the same path the HTTP API uses.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import pkg from "pg";

const { Pool } = pkg;
const DB = process.env.DATABASE_URL;

// Imports resolve against the full build (dist-full). Guarded so the file can be
// discovered even when skipped.
const { PatientDataService, AccessDeniedError } = DB ? await import("../dist-full/index.js") : {};
const repos = DB ? await import("../dist-full/infra/repositories.pg.js") : {};

const run = DB ? test : test.skip;
let pool;

before(async () => {
  if (!DB) return;
  pool = new Pool({ connectionString: DB });
  await pool.query("TRUNCATE consents, domain_events, audit_log, observations, escalations RESTART IDENTITY");
});

after(async () => {
  if (pool) await pool.end();
});

run("idempotent sync + consent-gated read persist correctly in Postgres", async () => {
  const svc = new PatientDataService({
    consents: new repos.PgConsentRepo(),
    events: new repos.PgEventRepo(),
    audit: new repos.PgAuditRepo(),
  });
  const patient = { id: "p1", role: "patient" };
  const now = Date.parse("2026-06-01T00:00:00Z");
  const batch = [
    { id: "e1", event: { type: "action_logged", day: 0, allMarkersInRange: false } },
    { id: "e2", event: { type: "action_logged", day: 1, allMarkersInRange: false } },
  ];

  assert.equal((await svc.syncEvents(patient, "p1", batch, now)).accepted, 2);
  // replay -> deduped by the UNIQUE(patient_id, idem_key) constraint
  assert.equal((await svc.syncEvents(patient, "p1", batch, now)).accepted, 0);

  const prog = await svc.getProgress(patient, "p1", now);
  assert.equal(prog.xp, 20);
  assert.equal(prog.streak, 2);

  // a clinician without consent is denied; granting consent lets them read
  const clinician = { id: "c1", role: "clinician" };
  await assert.rejects(() => svc.getProgress(clinician, "p1", now), AccessDeniedError);
  await new repos.PgConsentRepo().grant({ patientId: "p1", clinicianId: "c1", status: "active", grantedAt: now - 1 });
  assert.equal((await svc.getProgress(clinician, "p1", now)).xp, 20);

  // the audit chain recorded every decision and is intact
  const log = await new repos.PgAuditRepo().all();
  assert.ok(log.length >= 4);
  assert.ok(log.some((r) => r.action === "read:progress:deny"));
});

run("observations persist + coach-context derives from real Postgres data", async () => {
  const svc = new PatientDataService({
    consents: new repos.PgConsentRepo(),
    events: new repos.PgEventRepo(),
    audit: new repos.PgAuditRepo(),
    observations: new repos.PgObservationRepo(),
    escalations: new repos.PgEscalationRepo(),
  });
  const now = Date.parse("2026-06-01T12:00:00Z");
  const obs = (value, atIso) => ({
    resourceType: "Observation",
    status: "final",
    code: { coding: [{ system: "http://loinc.org", code: "2339-0", display: "Glucose" }] },
    subject: { reference: "Patient/p2" },
    effectiveDateTime: atIso,
    valueQuantity: { value, unit: "mg/dL" },
  });

  // first-party ingest is idempotent
  assert.equal((await svc.ingestObservation("p2", obs(120, "2026-06-01T08:00:00Z"), now)).deduped, false);
  assert.equal((await svc.ingestObservation("p2", obs(120, "2026-06-01T08:00:00Z"), now)).deduped, true);
  await svc.ingestObservation("p2", obs(260, "2026-06-01T10:00:00Z"), now);

  const patient = { id: "p2", role: "patient" };
  const timeline = await svc.listObservations(patient, "p2", now);
  assert.equal(timeline.length, 2);

  const ctx = await svc.getCoachContext(patient, "p2", now);
  assert.equal(ctx.recentMarkers[0].value, 260); // latest reading
  assert.equal(ctx.recentMarkers[0].status, "out-of-range");
});
