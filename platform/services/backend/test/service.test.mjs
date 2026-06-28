/**
 * service.test.mjs — end-to-end Phase-1 flow through PatientDataService (Vol 9, Vol 4/8).
 * Uses the in-memory repositories, so it exercises access-control + audit + idempotent
 * sync together — exactly the path the HTTP routes take — without needing a database.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PatientDataService,
  AccessDeniedError,
  InMemoryConsentRepo,
  InMemoryEventRepo,
  InMemoryAuditRepo,
  dedupeEvents,
  mergeLWW,
} from "../dist/index.js";

const NOW = Date.parse("2026-06-01T00:00:00Z");

function makeService() {
  const consents = new InMemoryConsentRepo();
  const events = new InMemoryEventRepo();
  const audit = new InMemoryAuditRepo();
  return { svc: new PatientDataService({ consents, events, audit }), consents, events, audit };
}

test("sync is idempotent and progress is derived server-side", async () => {
  const { svc } = makeService();
  const patient = { id: "p1", role: "patient" };
  const batch = [
    { id: "e1", event: { type: "action_logged", day: 0, allMarkersInRange: false } },
    { id: "e2", event: { type: "action_logged", day: 1, allMarkersInRange: false } },
  ];
  const first = await svc.syncEvents(patient, "p1", batch, NOW);
  assert.equal(first.accepted, 2);
  // replay the same batch -> all duplicates, no double XP
  const replay = await svc.syncEvents(patient, "p1", batch, NOW);
  assert.equal(replay.accepted, 0);
  assert.equal(replay.duplicates, 2);
  const prog = await svc.getProgress(patient, "p1", NOW);
  assert.equal(prog.xp, 20); // 2 actions * 10, counted once
  assert.equal(prog.streak, 2);
});

test("a clinician without consent is denied, and the denial is audited", async () => {
  const { svc, audit } = makeService();
  const clinician = { id: "c1", role: "clinician" };
  await assert.rejects(() => svc.getProgress(clinician, "p1", NOW), AccessDeniedError);
  const log = await audit.all();
  assert.ok(log.some((r) => r.action === "read:progress:deny" && r.target === "Patient/p1"));
});

test("granting consent lets the clinician read; revoking it locks them out", async () => {
  const { svc, consents } = makeService();
  const clinician = { id: "c1", role: "clinician" };
  await consents.grant({ patientId: "p1", clinicianId: "c1", status: "active", grantedAt: NOW - 1 });
  const ok = await svc.getProgress(clinician, "p1", NOW);
  assert.equal(typeof ok.xp, "number");
  await consents.revoke("p1", "c1", NOW);
  await assert.rejects(() => svc.getProgress(clinician, "p1", NOW + 1), AccessDeniedError);
});

test("sync helpers: dedupe within a batch and last-write-wins merge", () => {
  const fresh = dedupeEvents(new Set(["a"]), [
    { id: "a", event: 1 },
    { id: "b", event: 2 },
    { id: "b", event: 2 }, // intra-batch duplicate
  ]);
  assert.equal(fresh.length, 1);
  assert.equal(fresh[0].id, "b");
  assert.deepEqual(mergeLWW({ value: "old", updatedAt: 1 }, { value: "new", updatedAt: 2 }), {
    value: "new",
    updatedAt: 2,
  });
  // tie resolves to remote (server) value
  assert.equal(mergeLWW({ value: "local", updatedAt: 5 }, { value: "remote", updatedAt: 5 }).value, "remote");
});
