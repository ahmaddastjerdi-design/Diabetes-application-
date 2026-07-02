# Hamrah Doctor (HDOS) — Documentation Register

> The controlled register of every engineering document in the Hamrah Doctor
> platform. Numbering is stable and never reused (`HD-STD-DOC-0002`). Read
> [`../CLAUDE.md`](../CLAUDE.md) (Document 001) **first** — it governs everything
> below and nothing here may contradict it.

## Document control

| Field | Value |
|-------|-------|
| Document ID | `HDOS-DOC-REGISTER` |
| Owner | Head of Engineering |
| Status | `DRAFT` |
| Related | `HDOS-DOC-001` (governs this register) |

## Conventions

- Every document opens with a **Document Control** block and follows the
  Documentation Standards (`CLAUDE.md` §18).
- Every requirement is recorded in the **RMS format** (`CLAUDE.md` §19) in the
  [requirements registry](./registry/requirements.md).
- Status values: `PLANNED` · `DRAFT` · `IN REVIEW` · `APPROVED` · `DEPRECATED`.

## The document register

| # | ID | Document | Purpose | Status |
|---|----|----------|---------|--------|
| 000 | `HDOS-DOC-000` | [HD-OS Meta Specification](../HD-OS-Meta-Specification.md) | Project DNA — **read first**: identity, philosophy, naming, hierarchies, flows, Prime Directives, success, MDPF vision. | **DRAFT** |
| 001 | `HDOS-DOC-001` | [CLAUDE.md — Engineering Constitution](../CLAUDE.md) | Operational engineering constitution; loaded first by Claude Code, binds to the Meta Spec. | **DRAFT** |
| 002 | `HDOS-DOC-002` | HDOS-Constitution.md | Product & organisational constitution: values, non-negotiables, decision rights. | PLANNED |
| 003 | `HDOS-DOC-003` | Product-Vision.md | Vision, personas, scope, business goals, KPIs, roadmap. | PLANNED |
| 004 | `HDOS-DOC-004` | System-Architecture.md | End-to-end system architecture (C4), ratified stack, ADR index. | PLANNED |
| 005 | `HDOS-DOC-005` | Clinical-Architecture.md | Clinical model, decision-support framing, ISO 14971 risk framework. | PLANNED |
| 006 | `HDOS-DOC-006` | Database-Architecture.md | Data model, schema conventions, PHI encryption, retention/DSAR. | PLANNED |
| 007 | `HDOS-DOC-007` | FHIR-Architecture.md | FHIR R4 profiles, terminology bindings, mapping tables. | PLANNED |
| 008 | `HDOS-DOC-008` | API-Architecture.md | Contract-first API standards, OpenAPI/CapabilityStatement, versioning. | PLANNED |
| 009 | `HDOS-DOC-009` | Security-Architecture.md | HIPAA/GDPR/ISO 27001 controls, STRIDE threat models, IR plan. | PLANNED |
| 010 | `HDOS-DOC-010` | AI-System-Architecture.md | AI Health Coach: guardrails, grounding, evals, model governance. | PLANNED |
| 011 | `HDOS-DOC-011` | Design-System.md | Material 3 tokens, component library, RTL/dark, data-viz language. | PLANNED |
| 012 | `HDOS-DOC-012` | Accessibility-Standard.md | WCAG 2.2 AA conformance approach and test plan. | PLANNED |
| 013 | `HDOS-DOC-013` | QA-Test-Strategy.md | Test pyramid, coverage/eval gates, RTM process, CI gates. | PLANNED |
| 014 | `HDOS-DOC-014` | DevOps-Release.md | Environments, release gates, DHF, rollback, post-market surveillance. | PLANNED |
| … | | (documents 015–200+ as the platform is elaborated) | | PLANNED |

> The list above is the *planned spine*. Documents are added to the register when
> opened; numbers, once assigned, are permanent.

## Directory layout

```
projects/hamrah-doctor/            (incubation home; extraction-ready for its own repo)
  HD-OS-Meta-Specification.md      Document 000 — project DNA (READ FIRST)
  CLAUDE.md                        Document 001 — Engineering Constitution (Claude loads first)
  PROJECT_STATE.md                 Aegis-OS persistent state / roadmap motor
  docs/
    README.md                      this register
    registry/
      requirements.md              central requirement-ID registry (RMS records)
    001-…, 002-…                   numbered documents as they are authored
```

> **Repository status.** HD-OS is intended to live in its own repository (`hd-os`).
> The session that created these documents is scoped to a single existing repo and
> could not create/push a new one (GitHub `403`), so the suite incubates here under
> `projects/hamrah-doctor/`, structured so it lifts cleanly into a dedicated repo
> (`git subtree split` / `filter-repo`) once repo access exists. The canonical
> top-level layout for that repo is in Meta Spec Appendix A.

## How new documents are added

1. Reserve the next number in this register (never reuse a number).
2. Create the document with a Document Control block (`CLAUDE.md` §18).
3. Record any requirements it introduces in
   [`registry/requirements.md`](./registry/requirements.md) using the RMS format.
4. Ensure it does not contradict `HDOS-DOC-001`; link related documents.
5. Update `PROJECT_STATE.md` and the RTM; open a PR that passes the Definition of
   Done (`CLAUDE.md` §21).
