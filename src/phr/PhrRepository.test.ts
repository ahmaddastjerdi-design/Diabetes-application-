import { describe, it, expect, beforeEach } from "@jest/globals";
import { PhrRepository, PhrStorage } from "./PhrRepository";
import { GlucoseEntry, NoteEntry } from "./records";

/** A minimal in-memory PhrStorage so the repository is testable without native mocks. */
class MemoryStorage implements PhrStorage {
  private map = new Map<string, string>();
  async getItem(key: string) {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  async setItem(key: string, value: string) {
    this.map.set(key, value);
  }
  async removeItem(key: string) {
    this.map.delete(key);
  }
  /** Test-only: corrupt the stored blob. */
  poison(key: string, raw: string) {
    this.map.set(key, raw);
  }
}

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

const KEY = "test/phr";

describe("PhrRepository", () => {
  let storage: MemoryStorage;
  let repo: PhrRepository;

  beforeEach(() => {
    storage = new MemoryStorage();
    repo = new PhrRepository(storage, KEY);
  });

  it("starts empty", async () => {
    expect(await repo.all()).toEqual([]);
  });

  it("adds entries newest-first and persists them across instances", async () => {
    await repo.add(glucose("g1", "2026-01-01T08:00:00Z", 90));
    await repo.add(glucose("g2", "2026-01-02T08:00:00Z", 110));

    const fresh = new PhrRepository(storage, KEY);
    expect((await fresh.all()).map((e) => e.id)).toEqual(["g2", "g1"]);
  });

  it("removes an entry", async () => {
    await repo.add(glucose("g1", "2026-01-01T08:00:00Z", 90));
    await repo.remove("g1");
    expect(await repo.all()).toEqual([]);
  });

  it("updates an entry in place", async () => {
    await repo.add(glucose("g1", "2026-01-01T08:00:00Z", 90));
    await repo.update("g1", { value: 175 });
    const [e] = (await repo.all()) as GlucoseEntry[];
    expect(e.value).toBe(175);
  });

  it("filters and finds the latest of a kind", async () => {
    await repo.add(glucose("g1", "2026-01-01T08:00:00Z", 90));
    await repo.add(note("n1", "2026-01-03T08:00:00Z", "hi"));
    await repo.add(glucose("g2", "2026-01-05T08:00:00Z", 130));

    expect((await repo.ofKind("glucose")).map((e) => e.id)).toEqual([
      "g2",
      "g1",
    ]);
    expect((await repo.latest("glucose"))?.id).toBe("g2");
  });

  it("clears the whole record", async () => {
    await repo.add(glucose("g1", "2026-01-01T08:00:00Z", 90));
    await repo.clear();
    expect(await repo.all()).toEqual([]);
  });

  it("recovers to empty from a corrupt store", async () => {
    storage.poison(KEY, "{not valid json");
    expect(await repo.all()).toEqual([]);
  });

  it("tolerates a well-formed envelope missing its entries array", async () => {
    storage.poison(KEY, JSON.stringify({ version: 1 }));
    expect(await repo.all()).toEqual([]);
  });
});
