/**
 * core.test.mjs — device mapping + offline-queue tests (Vol 9, Vol 5).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { toObservation, measurementIdentifier, OfflineQueue } from "../dist/index.js";

const base = { patientId: "p1", deviceId: "d1", takenAtMs: Date.parse("2026-01-01T00:00:00Z") };

test("glucose in mmol/L is normalised to mg/dL with the correct LOINC code", () => {
  const obs = toObservation({ ...base, kind: "glucose", value: 7, unit: "mmol/L" });
  assert.equal(obs.valueQuantity.unit, "mg/dL");
  assert.equal(obs.valueQuantity.value, Math.round(7 * 18.0182)); // 126
  assert.equal(obs.code.coding[0].code, "2339-0");
  assert.equal(obs.subject.reference, "Patient/p1");
});

test("weight in pounds is normalised to kilograms", () => {
  const obs = toObservation({ ...base, kind: "weight", value: 200, unit: "lb" });
  assert.equal(obs.valueQuantity.unit, "kg");
  assert.ok(Math.abs(obs.valueQuantity.value - 90.7) < 0.1);
});

test("measurement identifier is stable for the same reading", () => {
  const m = { ...base, kind: "glucose", value: 7, unit: "mmol/L" };
  assert.deepEqual(measurementIdentifier(m), measurementIdentifier({ ...m }));
});

test("offline queue is idempotent and backs off on failure", () => {
  const q = new OfflineQueue();
  assert.equal(q.enqueue("id1", { a: 1 }), true);
  assert.equal(q.enqueue("id1", { a: 1 }), false, "duplicate id ignored");
  assert.equal(q.size, 1);

  const now = 1000;
  assert.equal(q.due(now).length, 1);
  q.fail("id1", now);
  assert.ok(q.due(now).length === 0, "failed item is delayed by backoff");
  q.ack("id1");
  assert.equal(q.size, 0);
});
