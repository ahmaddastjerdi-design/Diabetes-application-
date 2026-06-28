/**
 * domain.test.mjs — contract tests for the shared domain (Vol 9).
 * Dependency-free: Node's built-in test runner + assert. Run via `node --test`.
 * Imports the built package so it exercises exactly what consumers import.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { MARKERS, ORGANS, mgdlToMmol, mmolToMgdl } from "../dist/index.js";

test("glucose unit conversion round-trips exactly", () => {
  assert.ok(Math.abs(mgdlToMmol(mmolToMgdl(7)) - 7) < 1e-9);
  // 126 mg/dL is ~7.0 mmol/L (sanity of the factor).
  assert.ok(Math.abs(mgdlToMmol(126) - 7) < 0.05);
});

test("every marker has a healthy band inside its clamp and a baseline", () => {
  for (const m of Object.values(MARKERS)) {
    const [lo, hi] = m.healthy;
    const [clo, chi] = m.clamp;
    assert.ok(lo < hi, `${m.key} healthy band ordered`);
    assert.ok(clo <= lo && hi <= chi, `${m.key} band within clamp`);
    assert.equal(typeof m.baseline, "number");
  }
});

test("organ sensitivities reference real markers", () => {
  const markerKeys = new Set(Object.keys(MARKERS));
  for (const organ of Object.values(ORGANS)) {
    for (const k of Object.keys(organ.sensitivity)) {
      assert.ok(markerKeys.has(k), `${organ.key} -> unknown marker ${k}`);
    }
  }
});
