/**
 * clinical.test.mjs — decision-support, AGP metrics, and risk stratification (Vol 9, Vol 3).
 * Asserts the consensus-target thresholds behave correctly — these drive clinician alerts.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  timeInRanges,
  gmi,
  coefficientOfVariation,
  percentile,
  agpByHour,
  evaluate,
  topSeverity,
  riskScore,
  stratify,
} from "../dist/index.js";

const at = (h, v) => ({ value: v, atMs: Date.parse(`2026-06-01T${String(h).padStart(2, "0")}:00:00Z`) });

test("time-in-range buckets readings into the consensus bands", () => {
  const r = [at(0, 50), at(1, 65), at(2, 120), at(3, 120), at(4, 200), at(5, 300)];
  const tir = timeInRanges(r);
  assert.equal(tir.veryLow, 16.7); // 1/6
  assert.equal(tir.low, 16.7);
  assert.equal(tir.target, 33.3); // 2/6
  assert.equal(tir.high, 16.7);
  assert.equal(tir.veryHigh, 16.7);
});

test("GMI uses the Bergenstal formula", () => {
  // mean 154 mg/dL -> ~7.0%
  assert.equal(gmi(154), 7.0);
});

test("coefficient of variation flags instability", () => {
  const steady = [at(0, 120), at(1, 122), at(2, 118), at(3, 121)];
  assert.ok(coefficientOfVariation(steady) < 36);
  const swingy = [at(0, 60), at(1, 250), at(2, 70), at(3, 300)];
  assert.ok(coefficientOfVariation(swingy) > 36);
});

test("percentile + AGP-by-hour produce ordered bands", () => {
  assert.equal(percentile([10, 20, 30, 40], 50), 25);
  const bands = agpByHour([at(8, 100), at(8, 140), at(8, 180), at(9, 90)]);
  assert.equal(bands[0].hour, 8);
  assert.ok(bands[0].p25 <= bands[0].p50 && bands[0].p50 <= bands[0].p75);
});

const now = Date.parse("2026-06-02T00:00:00Z");

test("decision support: severe hypo exposure is urgent and advisory", () => {
  const readings = [at(0, 50), at(1, 50), at(2, 120), at(3, 120)]; // 50% < 54
  const flags = evaluate({ readings, lastReadingMs: at(3, 120).atMs }, now);
  const hypo = flags.find((f) => f.code === "severe-hypo-exposure");
  assert.ok(hypo);
  assert.equal(hypo.severity, "urgent");
  assert.equal(hypo.advisory, true);
  assert.equal(topSeverity(flags), "urgent");
});

test("decision support: healthy window in range raises no warnings", () => {
  const readings = Array.from({ length: 24 }, (_, h) => at(h, 110));
  const flags = evaluate({ readings, lastReadingMs: at(23, 110).atMs }, now);
  // only possibly a stale-data info if applicable; no warning/urgent
  assert.equal(flags.some((f) => f.severity !== "info"), false);
});

test("decision support: empty window reports no-data", () => {
  const flags = evaluate({ readings: [], lastReadingMs: 0 }, now);
  assert.equal(flags[0].code, "no-data");
});

test("risk stratification ranks the hypo-exposed patient highest", () => {
  const patients = [
    { patientId: "stable", tir: 85, timeBelow54: 0, cv: 30, lastReadingMs: now - 3_600_000 },
    { patientId: "hypo", tir: 60, timeBelow54: 4, cv: 40, lastReadingMs: now - 3_600_000 },
    { patientId: "mild", tir: 68, timeBelow54: 0, cv: 38, lastReadingMs: now - 3_600_000 },
  ];
  const ranked = stratify(patients, now);
  assert.equal(ranked[0].patientId, "hypo");
  assert.equal(ranked[0].tier, "high");
  assert.ok(ranked[0].score > ranked[1].score);
  assert.equal(ranked.at(-1).patientId, "stable");
});

test("risk score is bounded to 0..100", () => {
  const extreme = riskScore({ patientId: "x", tir: 0, timeBelow54: 100, cv: 100, lastReadingMs: 0 }, now);
  assert.ok(extreme <= 100 && extreme >= 0);
});
