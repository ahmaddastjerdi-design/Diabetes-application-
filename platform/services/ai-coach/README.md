# `services/ai-coach` — AI Health Coach (stub)

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
