# PHR — Personal Health Record module

A self-contained slice that stores the patient's **own, self-reported** health
record: measured vitals, notes, and clinician appointments. It is deliberately
separate from `src/engine/` — that is a *teaching simulation*; this is the
patient's real history.

> ⚕️ Educational prototype — **not** a medical device. Records are stored
> **locally on-device only** (AsyncStorage) and must never be treated as a
> clinical source of truth.

## Files

| File | Role |
|------|------|
| `records.ts` | Pure domain model — `PhrEntry` union + I/O-free helpers (`addEntry`, `entriesOfKind`, `latestOfKind`, `formatEntry`, …). |
| `PhrRepository.ts` | Persistence layer. A repository over AsyncStorage with its own storage key and versioned envelope. Backing store is injectable, so it's testable without native mocks. |
| `usePhr.ts` | React hook — load-once-then-mutate state (mirrors `useHealthConnect`). |
| `index.ts` | Barrel export. |
| `records.test.ts`, `PhrRepository.test.ts` | Jest unit tests. |

## Record kinds

`glucose` · `bloodPressure` · `weight` · `hba1c` · `note` · `appointment`
(each a member of the `PhrEntry` discriminated union — see `PHR_KINDS` for
labels and units).

## Usage

In a component:

```tsx
import { usePhr, newId } from "../phr";

function Vitals() {
  const phr = usePhr();
  if (!phr.ready) return null;

  const logGlucose = (value: number) =>
    phr.add({
      id: newId(),
      kind: "glucose",
      recordedAt: new Date().toISOString(),
      value,
      context: "fasting",
    });

  const readings = phr.ofKind("glucose"); // most-recent first
  // …
}
```

Directly (outside React), via the shared instance or your own:

```ts
import { phrRepository, PhrRepository } from "../phr";

await phrRepository.add(entry);
const latest = await phrRepository.latest("hba1c");

// Inject a custom store (e.g. in tests):
const repo = new PhrRepository(myStorage, "some/key");
```

## Design notes

- **Separate storage key** (`diabetes-quest/phr/v1`) — the PHR persists
  independently of the game state in `GameContext`, so neither can corrupt the
  other and each can migrate on its own schedule.
- **Corruption-tolerant reads** — a missing or unparceable blob resolves to an
  empty record rather than throwing (same posture as `GameContext`).
- **Pure core** — everything in `records.ts` is I/O-free, so the logic is
  covered by fast unit tests; persistence is exercised through an in-memory
  `PhrStorage` fake.
