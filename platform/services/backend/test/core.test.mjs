/**
 * core.test.mjs — backend domain core tests (Vol 9 §unit, Vol 4).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  deriveProgress,
  xpForLevel,
  levelFromXp,
  validateObservation,
  idempotencyKey,
  XP,
} from "../dist/index.js";

test("forgiving streak: a one-day gap is absorbed by a grace day", () => {
  const p = deriveProgress([
    { type: "action_logged", day: 0, allMarkersInRange: false },
    { type: "action_logged", day: 1, allMarkersInRange: false },
    { type: "action_logged", day: 3, allMarkersInRange: false }, // gap of 2 -> grace
  ]);
  assert.equal(p.streak, 3, "streak survives the missed day");
  assert.equal(p.graceDays, 0, "grace day was spent");
  assert.equal(p.xp, 3 * XP.logAction);
});

test("a larger gap restarts the streak at 1, never 0", () => {
  const p = deriveProgress([
    { type: "action_logged", day: 0, allMarkersInRange: false },
    { type: "action_logged", day: 10, allMarkersInRange: false },
  ]);
  assert.equal(p.streak, 1);
});

test("all-markers-in-range awards the daily bonus; lessons dedupe", () => {
  const p = deriveProgress([
    { type: "action_logged", day: 0, allMarkersInRange: true },
    { type: "lesson_completed", lessonId: "l1", passedQuiz: true },
    { type: "lesson_completed", lessonId: "l1", passedQuiz: true }, // duplicate ignored
  ]);
  assert.equal(p.xp, XP.logAction + XP.dailyAllMarkersInRange + XP.completeLesson + XP.passQuiz);
  assert.equal(p.lessonsCompleted, 1);
});

test("level curve matches the prototype", () => {
  assert.equal(xpForLevel(1), 100);
  assert.equal(levelFromXp(0), 1);
  assert.equal(levelFromXp(100), 2);
});

const validObs = {
  resourceType: "Observation",
  status: "final",
  code: { coding: [{ system: "http://loinc.org", code: "2339-0" }] },
  subject: { reference: "Patient/123" },
  effectiveDateTime: "2026-01-01T08:00:00.000Z",
  valueQuantity: { value: 110, unit: "mg/dL" },
};

test("validation accepts a well-formed Observation and rejects a bad subject", () => {
  assert.equal(validateObservation(validObs).ok, true);
  const bad = { ...validObs, subject: { reference: "Group/1" } };
  const res = validateObservation(bad);
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.includes("Patient")));
});

test("idempotency key is stable for identical readings and honours supplied identifiers", () => {
  assert.equal(idempotencyKey(validObs), idempotencyKey({ ...validObs }));
  const withId = { ...validObs, identifier: [{ system: "s", value: "v" }] };
  assert.equal(idempotencyKey(withId), "s|v");
});
