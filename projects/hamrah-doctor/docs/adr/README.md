# Architecture Decision Records (ADR)

> Significant architectural decisions for HD-OS, per CLAUDE.md §18
> (`HD-STD-DOC-0005`). Each ADR records **context → decision → alternatives →
> consequences**. ADR numbers are **immutable** and never reused; a reversed
> decision is captured by a **new** ADR that supersedes the old one (which is kept
> and marked `Superseded`).

| ADR | Title | Status |
|-----|-------|--------|
| [0001](./0001-technology-stack.md) | Ratify the HD-OS technology stack | Accepted (draft) |
| [0002](./0002-hexagonal-core.md) | Hexagonal core + adapters for all services | Accepted (draft) |

## Format

```
# ADR-NNNN — <title>
Status: Proposed | Accepted | Superseded by ADR-XXXX | Deprecated
Date / Deciders / Related requirement & rule IDs
## Context   — the forces and constraints
## Decision  — what we chose (imperative)
## Alternatives considered — with why-not
## Consequences — positive, negative, follow-ups
```

To add an ADR: take the next number, write it in this format, link it in the table
above and in the relevant architecture document, and obtain the approvals required
by Constitution Art. V.2 for the decision's domain.
