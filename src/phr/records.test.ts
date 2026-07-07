import { describe, it, expect } from "@jest/globals";
import {
  PhrEntry,
  GlucoseEntry,
  NoteEntry,
  addEntry,
  removeEntry,
  updateEntry,
  entriesOfKind,
  latestOfKind,
  byRecentFirst,
  formatEntry,
  newId,
} from "./records";

const glucose = (id: string, at: string, value: number): GlucoseEntry => ({
  id,
  kind: "glucose",
  recordedAt: at,
  value,
});

const note = (id: string, at: string, text: string): NoteEntry => ({
  id,
  kind: "note",
  recordedAt: at,
  text,
});

describe("newId", () => {
  it("produces unique ids even within the same millisecond", () => {
    const a = newId(1000);
    const b = newId(1000);
    expect(a).not.toBe(b);
  });
});

describe("addEntry", () => {
  it("prepends without mutating the input", () => {
    const before: PhrEntry[] = [glucose("a", "2026-01-01T08:00:00Z", 90)];
    const after = addEntry(before, glucose("b", "2026-01-02T08:00:00Z", 110));
    expect(after.map((e) => e.id)).toEqual(["b", "a"]);
    expect(before).toHaveLength(1); // unchanged
  });
});

describe("removeEntry", () => {
  it("removes by id and is a no-op for a missing id", () => {
    const list = [glucose("a", "2026-01-01T08:00:00Z", 90)];
    expect(removeEntry(list, "a")).toHaveLength(0);
    expect(removeEntry(list, "zzz")).toHaveLength(1);
  });
});

describe("updateEntry", () => {
  it("shallow-merges a patch but never changes id or kind", () => {
    const list: PhrEntry[] = [glucose("a", "2026-01-01T08:00:00Z", 90)];
    // Cast the patch to prove the id/kind guard holds even against a hostile one.
    const next = updateEntry(list, "a", {
      value: 200,
      kind: "note",
      id: "hacked",
    } as unknown as Partial<PhrEntry>);
    const e = next[0] as GlucoseEntry;
    expect(e.id).toBe("a");
    expect(e.kind).toBe("glucose");
    expect(e.value).toBe(200);
  });
});

describe("entriesOfKind / latestOfKind", () => {
  const list: PhrEntry[] = [
    glucose("g1", "2026-01-01T08:00:00Z", 90),
    note("n1", "2026-01-03T08:00:00Z", "felt good"),
    glucose("g2", "2026-01-05T08:00:00Z", 130),
  ];

  it("filters to a kind, most-recent first", () => {
    expect(entriesOfKind(list, "glucose").map((e) => e.id)).toEqual([
      "g2",
      "g1",
    ]);
  });

  it("returns the newest of a kind", () => {
    expect(latestOfKind(list, "glucose")?.id).toBe("g2");
    expect(latestOfKind(list, "note")?.id).toBe("n1");
    expect(latestOfKind(list, "weight")).toBeUndefined();
  });
});

describe("byRecentFirst", () => {
  it("sorts descending by recordedAt", () => {
    const list = [
      glucose("old", "2026-01-01T08:00:00Z", 90),
      glucose("new", "2026-02-01T08:00:00Z", 90),
    ];
    expect([...list].sort(byRecentFirst).map((e) => e.id)).toEqual([
      "new",
      "old",
    ]);
  });
});

describe("formatEntry", () => {
  it("renders each kind's value line", () => {
    expect(
      formatEntry({
        id: "1",
        kind: "glucose",
        recordedAt: "2026-01-01T08:00:00Z",
        value: 110,
        context: "fasting",
      })
    ).toBe("110 mg/dL (fasting)");
    expect(
      formatEntry({
        id: "2",
        kind: "bloodPressure",
        recordedAt: "2026-01-01T08:00:00Z",
        systolic: 120,
        diastolic: 80,
      })
    ).toBe("120/80 mmHg");
    expect(
      formatEntry({
        id: "3",
        kind: "appointment",
        recordedAt: "2026-01-01T08:00:00Z",
        title: "Diabetes review",
        clinician: "Dr. Ahmad",
        scheduledFor: "2026-02-01T09:00:00Z",
      })
    ).toBe("Diabetes review — Dr. Ahmad");
  });
});
