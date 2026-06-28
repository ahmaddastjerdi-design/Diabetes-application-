/**
 * sample.ts — synthetic, non-PHI data so the panel renders before the backend timeline
 * API exists (Vol 9: never use real patient data outside production). Deterministic.
 */
import type { GlucoseReading } from "@diabetes-quest/clinical";

const DAY = Date.parse("2026-06-01T00:00:00Z");

/** A day of readings every 15 min following a daily curve, with a named profile. */
function makeDay(profile: (hour: number) => number): GlucoseReading[] {
  const readings: GlucoseReading[] = [];
  for (let i = 0; i < 96; i++) {
    const hour = i / 4;
    readings.push({ value: Math.round(profile(hour)), atMs: DAY + i * 15 * 60_000 });
  }
  return readings;
}

const inRange = (h: number) => 110 + 25 * Math.sin((h / 24) * 2 * Math.PI);
const hypoProne = (h: number) => 90 + 60 * Math.sin((h / 24) * 2 * Math.PI) - (h > 2 && h < 5 ? 50 : 0);
const highVariability = (h: number) => 150 + 90 * Math.sin((h / 6) * 2 * Math.PI);

export interface SamplePatient {
  patientId: string;
  name: string;
  readings: GlucoseReading[];
  lastReadingMs: number;
}

export const SAMPLE_PATIENTS: SamplePatient[] = [
  { patientId: "p-aria", name: "Aria N.", readings: makeDay(inRange), lastReadingMs: DAY + 95 * 15 * 60_000 },
  { patientId: "p-ben", name: "Ben O.", readings: makeDay(hypoProne), lastReadingMs: DAY + 95 * 15 * 60_000 },
  { patientId: "p-cleo", name: "Cleo R.", readings: makeDay(highVariability), lastReadingMs: DAY + 95 * 15 * 60_000 },
];

export const SAMPLE_NOW = DAY + 96 * 15 * 60_000;
