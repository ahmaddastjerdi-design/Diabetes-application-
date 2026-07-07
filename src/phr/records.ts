/**
 * records.ts — the Personal Health Record (PHR) domain model.
 *
 * A PHR is the patient's own longitudinal record: measured vitals (glucose,
 * blood pressure, weight, HbA1c), free-text notes, and clinician appointments.
 * It is deliberately separate from the simulation in `engine/` — that is a
 * teaching model, this is the patient's real, self-reported history.
 *
 * Everything here is pure and I/O-free so it is trivially testable; persistence
 * lives in `PhrRepository.ts` and React wiring in `usePhr.ts`.
 *
 * ⚕️ Educational prototype — not a medical device. Records are stored locally
 * on-device only and must never be treated as a clinical source of truth.
 */

/** The kinds of thing a patient can record. */
export type PhrKind =
  | "glucose"
  | "bloodPressure"
  | "weight"
  | "hba1c"
  | "note"
  | "appointment";

interface PhrEntryBase {
  /** Stable unique id (see `newId`). */
  id: string;
  /** ISO-8601 timestamp the entry was recorded / applies to. */
  recordedAt: string;
}

/** A blood-glucose reading in mg/dL, optionally tagged with meal context. */
export interface GlucoseEntry extends PhrEntryBase {
  kind: "glucose";
  /** mg/dL. */
  value: number;
  context?: "fasting" | "preMeal" | "postMeal" | "random";
}

/** A blood-pressure reading in mmHg. */
export interface BloodPressureEntry extends PhrEntryBase {
  kind: "bloodPressure";
  systolic: number;
  diastolic: number;
}

/** Body weight in kilograms. */
export interface WeightEntry extends PhrEntryBase {
  kind: "weight";
  /** kg. */
  value: number;
}

/** An HbA1c lab result as a percentage. */
export interface Hba1cEntry extends PhrEntryBase {
  kind: "hba1c";
  /** %. */
  value: number;
}

/** A free-text note (symptoms, how the patient feels, questions for the GP). */
export interface NoteEntry extends PhrEntryBase {
  kind: "note";
  text: string;
}

/** A clinician appointment. `recordedAt` is when it was logged; `scheduledFor` when it happens. */
export interface AppointmentEntry extends PhrEntryBase {
  kind: "appointment";
  title: string;
  clinician?: string;
  /** ISO-8601 timestamp of the appointment itself. */
  scheduledFor: string;
}

export type PhrEntry =
  | GlucoseEntry
  | BloodPressureEntry
  | WeightEntry
  | Hba1cEntry
  | NoteEntry
  | AppointmentEntry;

/** Narrow a `PhrKind` string to its concrete entry type. */
export type PhrEntryOf<K extends PhrKind> = Extract<PhrEntry, { kind: K }>;

/** Human-friendly labels + units for each kind (used by UI and summaries). */
export const PHR_KINDS: Record<
  PhrKind,
  { label: string; emoji: string; unit?: string }
> = {
  glucose: { label: "Blood glucose", emoji: "🩸", unit: "mg/dL" },
  bloodPressure: { label: "Blood pressure", emoji: "🩺", unit: "mmHg" },
  weight: { label: "Weight", emoji: "⚖️", unit: "kg" },
  hba1c: { label: "HbA1c", emoji: "🧪", unit: "%" },
  note: { label: "Note", emoji: "📝" },
  appointment: { label: "Appointment", emoji: "📅" },
};

let idCounter = 0;

/**
 * Generate a stable-enough unique id for a new entry. Combines the wall clock
 * with a monotonic counter so ids stay unique even within the same millisecond.
 * Deterministic tests should pass their own ids rather than rely on this.
 */
export function newId(now: number = Date.now()): string {
  idCounter = (idCounter + 1) % 1_000_000;
  return `phr_${now.toString(36)}_${idCounter.toString(36)}`;
}

/** Most-recent-first comparator on `recordedAt`. */
export function byRecentFirst(a: PhrEntry, b: PhrEntry): number {
  return b.recordedAt.localeCompare(a.recordedAt);
}

/** Return a new list with `entry` prepended (does not mutate `entries`). */
export function addEntry(entries: PhrEntry[], entry: PhrEntry): PhrEntry[] {
  return [entry, ...entries];
}

/** Return a new list with the entry `id` removed (no-op if absent). */
export function removeEntry(entries: PhrEntry[], id: string): PhrEntry[] {
  return entries.filter((e) => e.id !== id);
}

/**
 * Return a new list with the matching entry shallow-merged with `patch`.
 * `kind` and `id` are never overwritten, keeping the discriminated union sound.
 */
export function updateEntry(
  entries: PhrEntry[],
  id: string,
  patch: Partial<PhrEntry>
): PhrEntry[] {
  return entries.map((e) =>
    e.id === id ? ({ ...e, ...patch, id: e.id, kind: e.kind } as PhrEntry) : e
  );
}

/** All entries of a given kind, most-recent first. */
export function entriesOfKind<K extends PhrKind>(
  entries: PhrEntry[],
  kind: K
): PhrEntryOf<K>[] {
  return entries
    .filter((e): e is PhrEntryOf<K> => e.kind === kind)
    .sort(byRecentFirst);
}

/** The single most recent entry of a kind, or `undefined` if none. */
export function latestOfKind<K extends PhrKind>(
  entries: PhrEntry[],
  kind: K
): PhrEntryOf<K> | undefined {
  return entriesOfKind(entries, kind)[0];
}

/** A short one-line rendering of an entry's value (for lists and summaries). */
export function formatEntry(entry: PhrEntry): string {
  switch (entry.kind) {
    case "glucose":
      return `${entry.value} mg/dL${entry.context ? ` (${entry.context})` : ""}`;
    case "bloodPressure":
      return `${entry.systolic}/${entry.diastolic} mmHg`;
    case "weight":
      return `${entry.value} kg`;
    case "hba1c":
      return `${entry.value}%`;
    case "note":
      return entry.text;
    case "appointment":
      return entry.clinician ? `${entry.title} — ${entry.clinician}` : entry.title;
  }
}
