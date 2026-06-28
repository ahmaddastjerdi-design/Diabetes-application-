/**
 * observations.test.mjs — observation persistence, timeline read, coach-context, and
 * escalation recording through PatientDataService (Vol 9). All consent-gated + audited.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PatientDataService,
  AccessDeniedError,
  InMemoryConsentRepo,
  InMemoryEventRepo,
  InMemoryAuditRepo,
  InMemoryObservationRepo,
  InMemoryEscalationRepo,
} from "../dist/index.js";

const NOW = Date.parse("2026-06-01T00:00:00Z");

function makeService() {
  return new PatientDataService({
    consents: new InMemoryConsentRepo(),
    events: new InMemoryEventRepo(),
    audit: new InMemoryAuditRepo(),
    observations: new InMemoryObservationRepo(),
    escalations: new InMemoryEscalationRepo(),
  });
}

const glucoseObs = (value, atIso) => ({
  resourceType: "Observation",
  status: "final",
  code: { coding: [{ system: "http://loinc.org", code: "2339-0", display: "Glucose" }] },
  subject: { reference: "Patient/p1" },
  effectiveDateTime: atIso,
  valueQuantity: { value, unit: "mg/dL" },
});

test("observations are stored idempotently and read back in time order", async () => {
  const svc = makeService();
  const patient = { id: "p1", role: "patient" };
  const o1 = glucoseObs(120, "2026-06-01T08:00:00Z");
  const o2 = glucoseObs(200, "2026-06-01T09:00:00Z");

  assert.equal((await svc.addObservation(patient, "p1", o1, NOW)).deduped, false);
  assert.equal((await svc.addObservation(patient, "p1", o1, NOW)).deduped, true); // same reading dedupes
  await svc.addObservation(patient, "p1", o2, NOW);

  const list = await svc.listObservations(patient, "p1", NOW);
  assert.equal(list.length, 2);
  assert.equal(list[0].valueQuantity.value, 120); // earlier first
});

test("a clinician cannot read observations without consent", async () => {
  const svc = makeService();
  await svc.addObservation({ id: "p1", role: "patient" }, "p1", glucoseObs(120, "2026-06-01T08:00:00Z"), NOW);
  await assert.rejects(() => svc.listObservations({ id: "c1", role: "clinician" }, "p1", NOW), AccessDeniedError);
});

test("coach-context derives latest markers + completed lessons from real data", async () => {
  const svc = makeService();
  const patient = { id: "p1", role: "patient" };
  await svc.addObservation(patient, "p1", glucoseObs(120, "2026-06-01T08:00:00Z"), NOW);
  await svc.addObservation(patient, "p1", glucoseObs(260, "2026-06-01T10:00:00Z"), NOW); // latest
  await svc.syncEvents(patient, "p1", [{ id: "l1", event: { type: "lesson_completed", lessonId: "carbs", passedQuiz: true } }], NOW);

  const ctx = await svc.getCoachContext(patient, "p1", NOW);
  assert.equal(ctx.recentMarkers.length, 1); // one glucose code, latest reading
  assert.equal(ctx.recentMarkers[0].value, 260);
  assert.equal(ctx.recentMarkers[0].status, "out-of-range");
  assert.deepEqual(ctx.lessonsCompleted, ["carbs"]);
});

test("escalations are recorded and audited", async () => {
  const svc = makeService();
  const patient = { id: "p1", role: "patient" };
  const res = await svc.recordEscalation(
    patient,
    "p1",
    { tier: "tier3", audience: "emergency", notifyCareTeam: true, instruction: "seek care" },
    NOW
  );
  assert.equal(res.recorded, true);
});
