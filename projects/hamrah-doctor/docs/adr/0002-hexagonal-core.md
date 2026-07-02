# ADR-0002 — Hexagonal core + adapters for all services

- **Status:** Accepted (draft — pending Head of Engineering sign-off)
- **Date:** (on acceptance)
- **Deciders:** Head of Engineering (owner)
- **Related:** `HDOS-DOC-004` §3–§4 · CLAUDE.md §4 (`HD-STD-CODE-0020`), §9 · Meta Spec Ch. 10–11

## Context

Clinical and AI logic must be deterministically testable, and the deterministic
safety layer must be able to sit in front of and override probabilistic components
(CLAUDE.md §6 `HD-STD-CODE-0026`). Mixing I/O with business rules makes safety
logic hard to test and audit — unacceptable for a Class II target.

## Decision

Every service (and the Flutter app's domain layer) is structured as
**ports-and-adapters (hexagonal)**:

- **`core/`** — pure domain logic: no network, DB, filesystem, wall-clock, or RNG.
  Time and randomness are injected. Clinical rules and guardrails live here.
- **`infra/`** — adapters implementing ports: DB repositories, HTTP clients, device
  connectors, model providers, clock.
- **thin entry** — wires infra to core and exposes transport; contains no business
  logic.

Deterministic safety (red-flag detection, hard-blocks) lives in `core/` and is
independent of the AI plane (Meta Spec Ch. 11; `HD-CLIN-PLAT-000001`).

## Alternatives considered

- **Layered MVC with services calling the DB directly** — rejected: couples rules
  to I/O, weakens testability and the safety-override guarantee.
- **Framework-centric (fat controllers/widgets)** — rejected: violates CLAUDE.md
  §8 `HD-STD-FLUT-0004` and §9 `HD-STD-BE-0002`.

## Consequences

- **Positive:** clinical/safety logic is unit-tested without infrastructure;
  guardrails provably precede models; adapters are swappable; matches the proven
  seed-prototype `core/` vs `infra/` split.
- **Negative / follow-ups:** more upfront boilerplate (ports/interfaces); a
  linting/CI check should enforce that `core/` imports no infra (a dependency-rule
  test is tracked as a testing requirement).
- Supersedes nothing; a change to this rule requires a new superseding ADR.
