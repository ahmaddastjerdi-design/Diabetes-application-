# `services/ai-coach` — AI Health Coach (Phase 4)

## Phase 4 — implemented (grounding + escalation + safety eval)

**Domain core** (`src/core/`, pure, strict TS, 11 unit tests):

- `guardrails.ts` — red-flag tiered `classifyMessage` + dosing hard block (`isDosingRequest`).
- `provider.ts` — provider-agnostic `CoachModelProvider`, the guardrailed `runCoach`
  orchestrator (guardrails win over the model), `StubCoachProvider`.
- `context.ts` — `buildGroundingContext`: grounds the coach in the user's OWN markers/
  organ trends/lessons; empty → coach defers to clinician, never invents numbers.
- `escalation.ts` — `planEscalation` (tier → audience + care-team notify) and `escalate`.
- `memory.ts` — bounded short-term window + rolling summary (`compact`) via an injected summarizer.
- `tools.ts` — the four audited tool definitions the model may call.

**Safety eval** (`src/eval/`, runnable gate):

- `dataset.ts` — labelled corpus (Tier-3/Tier-2 red-flags, dosing, benign).
- `harness.ts` — `runEval` + `passes`: enforces **≥99% Tier-3 recall, 0 dosing leaks,
  0 benign false-positives**. The Phase-4 test fails CI if the coach regresses.

**Infra** (`src/infra/`, real, CI-typechecked via `build:full`):

- `context.ts` — fetch grounding data from the backend; `notify.ts` — POST escalations.
- `src/server.ts` — pipeline per message: fetch grounding → `runCoach` → plan + execute
  escalation → reply, with the real Claude provider.

```bash
npm install
npm test -w @diabetes-quest/ai-coach    # 11 tests incl. the safety eval
ANTHROPIC_API_KEY=… BACKEND_URL=… npm run dev -w @diabetes-quest/ai-coach
```

### Still TODO (later work)

The backend `/coach-context` and `/escalations` endpoints, persistent conversation
memory storage, streaming responses, and the expanded red-team eval corpus.


The server-side, **Claude-powered** educational coaching service.
**Spec:** [Volume 6 — AI System](../../../docs/specification/06-ai-system.md) · security [Volume 8](../../../docs/specification/08-security-compliance.md).

Server-side only (so guardrails can't be bypassed), behind a provider-agnostic
`CoachModelProvider` interface, grounded in the user's own recent markers/organ trends
and the vetted lessons.

## Safety is the product (Vol 6)

- **Never** diagnoses, **never** doses/prescribes — a hard block on dose-like output.
- A red-flag detector with a **tiered escalation engine** to human clinicians / emergency services.
- Grounded to retrieved data; "I don't know — talk to your clinician" defaults; no fabricated numbers.

## First tasks (Vol 10 Phase 4)

1. `CoachModelProvider` interface + Claude implementation; layered system prompt.
2. Tool calls: `fetch_recent_observations`, `fetch_lessons`, `schedule_reminder`, `escalate_to_clinician`.
3. Red-flag classifier + escalation tiers; dosing/medication hard block.
4. Safety eval suite (≥99% Tier-3 red-flag recall; zero dose-like outputs) — gates release.

**Depends on:** `services/backend`. **DoD:** safety evals pass in CI (Vol 9); AI-disclosure
labelling; conversation memory privacy-preserving (Vol 8).
