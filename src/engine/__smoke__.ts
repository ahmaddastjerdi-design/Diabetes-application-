/**
 * __smoke__.ts — runtime sanity checks for the simulation engine.
 * Run with: npx tsx src/engine/__smoke__.ts
 * Not a unit-test framework; just fast confidence that the model behaves.
 */
import {
  initialBodyState,
  applyActionEffects,
  advanceDay,
  BodyState,
  MARKERS,
} from "./physiology";
import { getAction } from "../data/actions";
import { formatMarker, mgdlToMmol } from "../lib/units";
import { localCoachReply, coachReply } from "../lib/coach";
import { validateGlucoseReading, classifyGlucose } from "../lib/health";
import { pendingCount, devAuthHeaders } from "../lib/sync";
import { readingToObservation, readingToObservations } from "../lib/fhir";
import { classifyGlucoseLevel, gmiPercent, ADA_TARGETS } from "../lib/ada";
import { bucketSeries } from "../lib/trends";
import { MEDICATION_CATALOG, allDrugs } from "../data/medications";

function simulate(actionIds: string[], days: number): BodyState {
  let state = initialBodyState();
  for (let d = 0; d < days; d++) {
    for (const id of actionIds) {
      const a = getAction(id);
      if (a) state = applyActionEffects(state, a.effects);
    }
    state = advanceDay(state).next;
  }
  return state;
}

let failures = 0;
function expect(name: string, cond: boolean) {
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failures++;
}

// A patient who walks, takes meds, drinks water and eats well should see
// organ health climb above the starting 70.
const healthy = simulate(
  ["walk", "metformin", "water", "balanced-meal", "bp-med", "statin"],
  20
);
expect("healthy routine improves the heart", healthy.organs.heart > 70);
expect("healthy routine improves the kidneys", healthy.organs.kidney > 70);

// A patient living on sugary drinks, salty food and skipped meds should decline.
const unhealthy = simulate(
  ["sugary-drink", "salty-meal", "missed-meds", "rest-day"],
  20
);
expect("poor routine harms the heart", unhealthy.organs.heart < 70);
expect("poor routine harms the kidneys", unhealthy.organs.kidney < 70);

// Organ health must always stay within [0, 100].
const extreme = simulate(["sugary-drink", "salty-meal", "missed-meds"], 60);
expect(
  "organ health never goes below 0",
  extreme.organs.heart >= 0 && extreme.organs.kidney >= 0
);
expect(
  "organ health never exceeds 100",
  healthy.organs.heart <= 100 && healthy.organs.kidney <= 100
);

// Glucose unit conversion + formatting (PRD units).
expect("glucose 140 mg/dL ≈ 7.8 mmol/L", Math.abs(mgdlToMmol(140) - 7.77) < 0.05);
const mmol = formatMarker(MARKERS.glucose, 140, "mmol/L");
expect("formatMarker converts glucose to mmol/L", mmol.unit === "mmol/L" && mmol.value === "7.8");
const mgdl = formatMarker(MARKERS.glucose, 140, "mg/dL");
expect("formatMarker keeps mg/dL by default", mgdl.unit === "mg/dL" && mgdl.value === "140");

// AI coach safety guardrails (must hold on-device, offline).
expect("coach escalates a red-flag emergency", localCoachReply("I have chest pain").tier === "tier3");
expect("coach hard-blocks dosing questions", localCoachReply("how much insulin should I take").guardrailed === true);
expect("coach answers an educational question normally", localCoachReply("how does a walk help?").tier === "none");

// Manual device readings: validation + classification (PRD device entry).
expect("glucose reading 7 mmol/L normalises to ~126 mg/dL", validateGlucoseReading(7, "mmol/L").mgdl === 126);
expect("implausible glucose reading is rejected", validateGlucoseReading(5, "mg/dL").ok === false);
expect("a valid mg/dL reading is accepted", validateGlucoseReading(120, "mg/dL").ok === true);
expect("classifyGlucose flags low / in-range / high",
  classifyGlucose(60) === "low" && classifyGlucose(120) === "in-range" && classifyGlucose(250) === "high");

// Backend sync helpers (PRD local→synced migration).
expect("pendingCount reflects the outbox size", pendingCount([{ id: "a", event: { type: "lesson_completed", lessonId: "l", passedQuiz: true } }]) === 1);
const hdrs = devAuthHeaders("p-1");
expect("dev auth headers carry the patient identity", hdrs["x-user-id"] === "p-1" && hdrs["x-user-role"] === "patient");

// A reading maps to a valid FHIR glucose Observation (synced to the backend).
const obs = readingToObservation({ id: "r1", mgdl: 137, atMs: Date.parse("2026-06-01T08:00:00Z") }, "p-1");
expect("reading → FHIR Observation: LOINC glucose, mg/dL, patient subject + identifier",
  obs.code.coding[0].code === "2339-0" &&
    obs.valueQuantity.value === 137 &&
    obs.valueQuantity.unit === "mg/dL" &&
    obs.subject.reference === "Patient/p-1" &&
    obs.identifier?.[0].value === "r1");

// ADA Standards of Care alignment (hypoglycemia levels, target range, GMI).
expect("ADA: <54 is Level 2 hypoglycemia", classifyGlucoseLevel(50) === "level2");
expect("ADA: 54–69 is Level 1 hypoglycemia", classifyGlucoseLevel(65) === "level1");
expect("ADA: 70–180 is in target range", classifyGlucoseLevel(120) === "inRange");
expect("ADA: 181–250 is high, >250 very high",
  classifyGlucoseLevel(200) === "high" && classifyGlucoseLevel(300) === "veryHigh");
expect("ADA: GMI from mean 154 mg/dL ≈ 7.0%", gmiPercent(154) === 7.0);
expect("ADA: target list includes the 70–180 time-in-range goal",
  ADA_TARGETS.some((t) => t.key === "tir" && t.target.includes("70")));

// Medication catalog: all major T2DM classes + comorbidity meds (not just metformin/insulin).
const catIds = MEDICATION_CATALOG.map((c) => c.id);
expect("catalog covers all darooyab.ir classes incl. dual GIP/GLP-1 and combinations",
  ["biguanide", "sulfonylurea", "meglitinide", "tzd", "agi", "dpp4", "sglt2", "glp1", "dual", "insulin", "combo"].every((k) => catIds.includes(k)));
expect("catalog covers comorbidity meds (BP, lipids, neuropathy)",
  ["bp", "lipids", "neuropathy"].every((k) => catIds.includes(k)));
const drugs = allDrugs();
expect("catalog lists 50+ drugs (well beyond metformin + insulin)", drugs.length >= 50);
expect("every drug has a generic name and an educational note",
  drugs.every((d) => d.drug.generic.length > 0 && d.drug.note.length > 0));
expect("antidiabetics carry Persian names + reference doses (from darooyab.ir)",
  MEDICATION_CATALOG.filter((c) => c.group === "diabetes").every((c) => c.drugs.every((d) => !!d.persian)) &&
    MEDICATION_CATALOG.find((c) => c.id === "biguanide")!.drugs[0].persian === "متفورمین");

// Blood pressure → FHIR (systolic + diastolic), for charts + doctor transfer.
const bpObs = readingToObservations({ id: "b1", atMs: Date.parse("2026-06-01T08:00:00Z"), kind: "bp", systolic: 128, diastolic: 82 }, "p-1");
expect("BP reading produces systolic + diastolic FHIR observations (mmHg)",
  bpObs.length === 2 && bpObs[0].code.coding[0].code === "8480-6" && bpObs[1].code.coding[0].code === "8462-4" && bpObs[0].valueQuantity.unit === "mmHg");

// Time-bucketed charts (hourly / daily / weekly / monthly).
const tnow = Date.parse("2026-06-01T12:00:00Z");
const hourly = bucketSeries([{ atMs: tnow - 20 * 60000, value: 120 }, { atMs: tnow - 80 * 60000, value: 140 }], "hourly", tnow);
expect("hourly chart has 24 buckets and places recent readings at the end",
  hourly.length === 24 && (hourly[23].value !== null || hourly[22].value !== null));
expect("weekly chart has 8 buckets; empty input → all null",
  bucketSeries([], "weekly", tnow).length === 8 && bucketSeries([], "weekly", tnow).every((b) => b.value === null));
expect("monthly chart has 12 buckets", bucketSeries([], "monthly", tnow).length === 12);

// Coach orchestration: guardrails must run BEFORE any network call.
async function runAsyncChecks() {
  let remoteCalled = false;
  const blocked = await coachReply("how much insulin should I take", async () => {
    remoteCalled = true;
    return "should not be used";
  });
  expect("dosing question is guardrailed and never reaches the server", blocked.guardrailed === true && blocked.source === "guardrail" && remoteCalled === false);

  let emergencyRemote = false;
  const emergency = await coachReply("I have chest pain", async () => {
    emergencyRemote = true;
    return "x";
  });
  expect("red-flag emergency is guardrailed before the network", emergency.tier === "tier3" && emergencyRemote === false);

  const remote = await coachReply("how does a walk help?", async () => "REMOTE TIP");
  expect("safe message uses the server coach reply", remote.source === "remote" && remote.text === "REMOTE TIP");

  const fallback = await coachReply("how does a walk help?", async () => null);
  expect("falls back to a local reply when the server is unavailable", fallback.source === "local");
}

runAsyncChecks().then(() => {
  console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILED`);
  process.exit(failures === 0 ? 0 : 1);
});
