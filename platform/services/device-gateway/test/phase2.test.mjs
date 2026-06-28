/**
 * phase2.test.mjs — connectors, worker, FHIR Device, cross-origin dedup (Vol 9, Vol 5).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fromHealthConnect,
  fromDexcomEgv,
  preferByOrigin,
  drainOnce,
  toObservation,
  toFhirDevice,
  OfflineQueue,
  CERTIFICATION_CHECKLIST,
} from "../dist/index.js";

test("Health Connect + Dexcom payloads normalise to the same internal shape", () => {
  const hc = fromHealthConnect(
    { recordType: "BloodGlucose", time: "2026-06-01T08:00:00Z", value: 7, unit: "mmol/L", dataOrigin: "com.dexcom.g7" },
    "p1"
  );
  assert.equal(hc.kind, "cgm");
  assert.equal(hc.patientId, "p1");
  const dex = fromDexcomEgv({ systemTime: "2026-06-01T08:00:00Z", value: 126, transmitterId: "TX1" }, "p1");
  assert.equal(dex.kind, "cgm");
  assert.equal(dex.unit, "mg/dL");
  assert.equal(dex.deviceId, "dexcom:TX1");
});

test("cross-origin dedup keeps the higher-priority source for the same reading", () => {
  const t = "2026-06-01T08:00:00Z";
  const records = [
    fromHealthConnect({ recordType: "BloodGlucose", time: t, value: 7, unit: "mmol/L", dataOrigin: "com.google.health" }, "p1"),
    fromDexcomEgv({ systemTime: t, value: 126, transmitterId: "TX1" }, "p1"),
  ];
  const kept = preferByOrigin(records, ["dexcom", "com.google"]);
  assert.equal(kept.length, 1);
  assert.equal(kept[0].deviceId, "dexcom:TX1"); // vendor cloud preferred over aggregator
});

test("device registration maps to a FHIR Device with firmware + type code", () => {
  const dev = toFhirDevice({
    deviceId: "TX1",
    patientId: "p1",
    type: "cgm",
    manufacturer: "Dexcom",
    model: "G7",
    firmware: "1.4.2",
  });
  assert.equal(dev.resourceType, "Device");
  assert.equal(dev.patient.reference, "Patient/p1");
  assert.equal(dev.version?.[0].value, "1.4.2");
  assert.equal(dev.type.coding[0].code, "709586007");
  assert.ok(CERTIFICATION_CHECKLIST.length >= 5);
});

test("worker delivers due items once, acking on success", async () => {
  const q = new OfflineQueue();
  const obs = toObservation(fromDexcomEgv({ systemTime: "2026-06-01T08:00:00Z", value: 126, transmitterId: "TX1" }, "p1"));
  q.enqueue(obs.identifier[0].value, obs);
  const delivered = [];
  const summary = await drainOnce(q, async (o) => (delivered.push(o), { ok: true }), 1000);
  assert.equal(summary.delivered, 1);
  assert.equal(q.size, 0, "acked item leaves the queue");
});

test("worker backs off a failed delivery and retries on a later tick", async () => {
  const q = new OfflineQueue();
  q.enqueue("id1", { resourceType: "Observation" });
  const s1 = await drainOnce(q, async () => ({ ok: false }), 1000);
  assert.equal(s1.failed, 1);
  assert.equal(q.size, 1, "failed item stays queued");
  assert.equal(q.due(1000).length, 0, "but is delayed by backoff");
  // a tick far enough in the future re-delivers it
  const s2 = await drainOnce(q, async () => ({ ok: true }), 1_000_000);
  assert.equal(s2.delivered, 1);
});
