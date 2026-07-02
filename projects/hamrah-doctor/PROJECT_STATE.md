<!--
  Aegis-OS persistent state engine for HD-OS (Hamrah Doctor Operating System).
  Read at the start of every turn, rewrite at the end. Percentages advance only
  against VERIFIED status. This is the documentation-foundation phase: no product
  code is written until the foundational document spine is approved (CTO gate).
-->

# PROJECT_STATE.md — HD-OS (Hamrah Doctor Operating System)

## 1. Overall Completion Radar
- **Current Progress:** ~11% (of the full platform); **Foundational-docs spine: ~62%**
- **Current Active Phase:** Phase D0 — Engineering Foundation (documentation-first)
- **Next Immediate Dependency:** Clinical-Knowledge Standards (CKE governance) +
  FHIR-Profiling Standards — the clinical-work unblockers; then Testing, Security,
  Contribution Guide. Stack confirmed **Flutter** (ADR-0001 unchanged).

> Gate (CTO directive): **no Flutter/product code is written until the foundational
> document set is authored and approved.** Percentages here measure the
> documentation foundation, not product implementation.

## 2. 0-100% Master Roadmap
- [~] **Phase D0 — Engineering Foundation (docs)** (Status: **Active**)
  - Meta Spec, Constitution, ADRs, Coding/Clinical-Knowledge/FHIR/UI/Testing/
    Security standards, Contribution Guide — approved before any implementation.
- [ ] **Phase 1 — Core Platform** (Status: Pending) — identity, consent, FHIR data
  plane, audit, security core (disease-agnostic; MDPF core).
- [ ] **Phase 2 — Clinical Engines** (Status: Pending) — CKE (knowledge), CDE
  (decision), DTE (digital twin), AI-flow with explainability + clinical review.
- [ ] **Phase 3 — Device Integration** (Status: Pending) — Health Connect, BLE/GATT,
  vendor cloud → FHIR (CGM/BGM/BP/scale/SpO₂).
- [ ] **Phase 4 — Applications** (Status: Pending) — Flutter patient app, clinician
  web panel (Material 3, RTL, WCAG 2.2 AA).
- [ ] **Phase 5 — Verification, Security & Regulatory Hardening** (Status: Pending)
  — safety-eval gates, DHF, ISO 14971 risk file, release gates (Meta Spec Ch. 13).

## 3. Atomic Task Queue (Phase D0 — foundational documents)
1. [x] `HDOS-DOC-000` Meta Specification (project DNA) → Verify: peer/clinical review.
2. [x] `HDOS-DOC-001` CLAUDE.md Engineering Constitution → Verify: review.
3. [x] Documentation register + requirements registry (RMS, domain-segmented IDs).
4. [x] `HDOS-DOC-002` Constitution (values, patient rights, charters, decision rights).
5. [x] `HDOS-DOC-004` System-Architecture (C4, engines, MDPF, ratified stack) + ADR-0001/0002.
6. [x] `HDOS-DOC-011` UI Design System (Flutter-first; tokens, `UI_` components, data-viz).
7. [ ] Clinical-Knowledge Standards (CKE governance) + FHIR-Profiling Standards.
8. [ ] Testing Standards · Security Standards · Contribution Guide (remaining set).
9. [ ] `HDOS-DOC-003` Product-Vision (may run in parallel).

## 4. Architectural System Inventory
Status: **Authored** = written, review pending · **Planned** = registered, not written.

- `HD-OS-Meta-Specification.md` (`HDOS-DOC-000`): **Authored** (Ch. 1,2,6,8–16;
  Ch. 3,4,5,7 RESERVED by design).
- `CLAUDE.md` (`HDOS-DOC-001`, 23 sections + appendices): **Authored** (reconciled to
  HD-OS naming, domain-segmented IDs, Prime-Directive read order).
- `docs/README.md` (document register, incl. Doc 000): **Authored**.
- `docs/registry/requirements.md` (RMS; seeds HD-REQ-PLAT-000001/2, HD-CLIN-PLAT-000001,
  HD-TEST-CDE-000001): **Authored**.
- `docs/002-HDOS-Constitution.md` (`HDOS-DOC-002`, Articles I–XII + decision-rights
  matrix + amendment process): **Authored** (review/ratification pending).
- `docs/004-System-Architecture.md` (`HDOS-DOC-004`, C4 L1/L2, CKE/CDE/DTE, AI/data/
  security planes, MDPF, ratified stack, ADR index): **Authored**.
- `docs/adr/` — ADR-0001 (stack), ADR-0002 (hexagonal core) + index: **Authored**.
- `docs/011-UI-Design-System.md` (`HDOS-DOC-011`, Flutter-first tokens/components/
  data-viz/a11y): **Authored**.
- `HDOS-DOC-003, 005, 006, 007, 009, 010, 012, 013, 014`: **Planned**.

## 5. Blockers & Edge Cases Addressed
- **Repository provisioning blocked** → this session's GitHub token is scoped to a
  single existing repo; creating a new `hd-os` repo returns `403 Resource not
  accessible by integration`. **Mitigation:** incubate under
  `projects/hamrah-doctor/`, structured for clean `git subtree`/`filter-repo`
  extraction once repo-creation access exists. Documented in `docs/README.md`.
- **ID-scheme evolution captured pre-commit** → the domain-segmented grammar
  (`HD-<TYPE>-<DOMAIN>-<NNNNNN>`) and naming prefixes (PAT_/CLN_/AI_/…) arrived
  after initial drafting; because nothing was committed, seed IDs were corrected to
  the final grammar before becoming immutable. No renumbering of committed IDs.
- **Reserved chapters** → Meta Spec Ch. 3,4,5,7 held open (numbers permanent) so the
  user's forthcoming content slots in without renumbering neighbours.
- **Positioning honesty** → every foundational doc states HD-OS is engineered
  *toward* a regulated posture; clinical/device claims require the §5/§20/Ch.13 gates.

---
_Last synchronized: 2026-07-02. Recent turns: authored HDOS-DOC-000 (Meta Spec),
reconciled HDOS-DOC-001 (CLAUDE.md), then authored HDOS-DOC-002 (Constitution) and
HDOS-DOC-004 (System-Architecture) with seed ADR-0001/0002. No code written (D0
gate). Repo creation attempted and blocked (403); work incubates in subfolder,
extraction-ready._
