<!--
  Aegis-OS persistent state engine for HD-OS (Hamrah Doctor Operating System).
  Read at the start of every turn, rewrite at the end. Percentages advance only
  against VERIFIED status. This is the documentation-foundation phase: no product
  code is written until the foundational document spine is approved (CTO gate).
-->

# PROJECT_STATE.md — HD-OS (Hamrah Doctor Operating System)

## 1. Overall Completion Radar
- **Current Progress:** ~6% (of the full platform); **Foundational-docs spine: ~35%**
- **Current Active Phase:** Phase D0 — Engineering Foundation (documentation-first)
- **Next Immediate Dependency:** `HDOS-DOC-002` Constitution, then `HDOS-DOC-004`
  System-Architecture (which ratifies stack + repo structure + ADR index).

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
4. [ ] `HDOS-DOC-002` Constitution (values, decision rights, non-negotiables).
5. [ ] `HDOS-DOC-004` System-Architecture (C4, ratified stack, ADR index).
   - then: Clinical-Knowledge, FHIR-Profiling, UI-Design-System, Testing,
     Security standards, Contribution Guide (CTO foundational set).

## 4. Architectural System Inventory
Status: **Authored** = written, review pending · **Planned** = registered, not written.

- `HD-OS-Meta-Specification.md` (`HDOS-DOC-000`): **Authored** (Ch. 1,2,6,8–16;
  Ch. 3,4,5,7 RESERVED by design).
- `CLAUDE.md` (`HDOS-DOC-001`, 23 sections + appendices): **Authored** (reconciled to
  HD-OS naming, domain-segmented IDs, Prime-Directive read order).
- `docs/README.md` (document register, incl. Doc 000): **Authored**.
- `docs/registry/requirements.md` (RMS; seeds HD-REQ-PLAT-000001/2, HD-CLIN-PLAT-000001,
  HD-TEST-CDE-000001): **Authored**.
- `HDOS-DOC-002 … 014+`: **Planned** (registered in `docs/README.md`).

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
_Last synchronized: 2026-07-02. This turn: authored HDOS-DOC-000 (Meta Spec) and
reconciled HDOS-DOC-001 (CLAUDE.md), the register, and the RMS registry to the HD-OS
canon (name, audience, domain-segmented IDs, Prime Directives, read order). No code
written (D0 gate). Repo creation attempted and blocked (403); work incubates in
subfolder, extraction-ready._
