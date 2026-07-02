# Requirements Registry (RMS)

> The central, authoritative registry of HD-OS requirement IDs. IDs are allocated
> **only** from here, are **immutable**, and are **never renumbered or reused**
> (`CLAUDE.md` §19; Meta Spec `HDOS-DOC-000` Ch. 6.1; `HD-STD-DOC-0030`). Every
> entry uses the mandatory **RMS record format** (`HD-STD-DOC-0021`).

## Document control

| Field | Value |
|-------|-------|
| Document ID | `HDOS-DOC-REGISTRY-REQ` |
| Owner | Head of Engineering (allocation) · domain owners (content) |
| Status | `DRAFT` |
| ID grammar | `HD-<TYPE>-<DOMAIN>-<NNNNNN>` (Meta Spec Ch. 6.1) |
| Governs `<TYPE>` | `REQ` `CLIN` `AI` `UI` `API` `DB` `DEV` `SEC` `TEST` |

## ID grammar recap

`HD-<TYPE>-<DOMAIN>-<NNNNNN>` — `<DOMAIN>` is the module/subsystem segment
(`DM`, `CKD`, `LAB`, `PAT`, `HOME`, `AUTH`, `CGM`, `DTE`, `CDE`, `CKE`, … or
`PLAT` for platform-wide). Numbers are zero-padded to 6 digits, allocated in
order per `(TYPE, DOMAIN)` pair.

## Allocation counters

Next free number per `(TYPE, DOMAIN)` (increment on allocation; never decrement):

| TYPE-DOMAIN | Next free |
|-------------|-----------|
| `HD-REQ-PLAT-`  | `000003` |
| `HD-CLIN-PLAT-` | `000002` |
| `HD-TEST-CDE-`  | `000002` |
| _(all other `(TYPE, DOMAIN)` pairs)_ | `000001` |

> `HD-REQ-PLAT-000001` / `-000002` are defined in `CLAUDE.md` §1–§2 and Meta Spec
> Ch. 1/15. Their canonical RMS records are below.

---

## Records

### HD-REQ-PLAT-000001 — Mission

```yaml
id:                 HD-REQ-PLAT-000001
title:              Platform mission — safe, AI-native clinical operating system
description: >
  HD-OS provides an AI-native, clinical-grade digital-health operating system that
  helps people with chronic conditions (starting with diabetes) understand and
  manage their health in partnership with clinicians, on a FHIR-native,
  disease-extensible core, with patient safety as the first obligation.
clinical_rationale: >
  Chronic-disease outcomes improve with comprehension, adherence, and timely
  clinician escalation; the platform's purpose is to enable these safely.
business_rationale: Defines the product's reason to exist and its scope guardrails.
priority:           Critical
risk_class:         Foundational (governs all clinical risk controls)
dependencies:       []
acceptance_criteria:
  - Every feature traces to advancing safe chronic-care management.
  - No feature ships that subordinates safety to engagement/growth.
  - Core contains no disease-specific logic (MDPF, Meta Spec Ch. 16).
fhir_mapping:       n/a (governance requirement)
db_mapping:         n/a
api_mapping:        n/a
ui_mapping:         n/a
test_case_ids:      []
guideline_refs:     [ADA Standards of Care, WHO diabetes guidance]
owner:              Head of Engineering / CMO
approval_status:    Draft
version_history:
  - {version: 1.0.0, date: on-issue, change: "initial", by: Head of Engineering}
```

### HD-REQ-PLAT-000002 — Vision

```yaml
id:                 HD-REQ-PLAT-000002
title:              Platform vision — trustworthy, human-in-the-loop companion
description: >
  Deliver an always-available health companion that makes the consequences of
  daily choices visible, closes the loop with real clinicians before risk becomes
  harm, treats patient data as a fiduciary responsibility, and scales from
  thousands to millions while every clinical decision stays auditable.
clinical_rationale: Human-in-the-loop and timely escalation prevent harm.
business_rationale: North-star that differentiates and constrains the product.
priority:           Critical
risk_class:         Foundational
dependencies:       [HD-REQ-PLAT-000001]
acceptance_criteria:
  - Software never replaces clinical judgment on diagnosis/dosing/prescription.
  - Data is portable (FHIR export/DSAR) and privacy-protective by default.
  - First-class Persian (RTL) experience and WCAG 2.2 AA accessibility.
  - New disease modules add without redesigning the core.
fhir_mapping:       n/a
db_mapping:         n/a
api_mapping:        n/a
ui_mapping:         n/a
test_case_ids:      []
guideline_refs:     []
owner:              Head of Engineering / CMO
approval_status:    Draft
version_history:
  - {version: 1.0.0, date: on-issue, change: "initial", by: Head of Engineering}
```

### HD-CLIN-PLAT-000001 — Deterministic red-flag escalation (seed example)

> Seed record demonstrating the RMS format for a safety-critical, platform-level
> clinical control. Disease modules extend it with module-specific red flags
> (e.g. `HD-CLIN-DM-*`). Elaborated in `HDOS-DOC-005` (Clinical-Architecture).

```yaml
id:                 HD-CLIN-PLAT-000001
title:              Deterministic red-flag detection and escalation (core)
description: >
  Defined red-flag conditions (e.g. severe hypo/hyperglycaemia, DKA symptoms,
  cardiac/stroke warning signs, suicidal ideation) must trigger an immediate,
  deterministic escalation path (emergency guidance + human notification) that
  does not depend on a model decision.
clinical_rationale: >
  Delayed recognition of these conditions can cause severe harm or death;
  detection must not rely on a probabilistic component.
business_rationale: Core trust and safety guarantee; regulatory prerequisite.
priority:           Critical
risk_class:         High severity / must be mitigated (ISO 14971)
dependencies:       [HD-REQ-PLAT-000001]
acceptance_criteria:
  - Detection runs in deterministic code, independent of model output.
  - Escalation fires even when offline or the model/network is unavailable.
  - Tier-3 red-flag recall >= 99% on the labelled safety-eval set.
  - Dosing/diagnosis requests are hard-blocked (100%) and redirected to a human.
fhir_mapping:       FHIR_ Observation (LOINC), Flag, CommunicationRequest
db_mapping:         CLN_ escalations table (append-only, audited)
api_mapping:        API_ POST /v1/coach/turn (guardrail pre/post filter)
ui_mapping:         UI_ Coach emergency banner; clinician alert surface
test_case_ids:      [HD-TEST-CDE-000001]
guideline_refs:     [ADA hypo/hyperglycaemia guidance, local emergency protocols]
owner:              Chief Medical Officer
approval_status:    Draft
version_history:
  - {version: 1.0.0, date: on-issue, change: "seed record", by: CMO}
```

### HD-TEST-CDE-000001 — Red-flag safety-eval suite (seed example)

```yaml
id:                 HD-TEST-CDE-000001
title:              Red-flag / hard-block safety-eval suite
description: >
  Automated eval suite asserting deterministic red-flag detection recall and 100%
  hard-blocking of dosing/diagnosis requests, including offline behaviour and
  prompt-injection resistance.
clinical_rationale: Verifies the HD-CLIN-PLAT-000001 safety control.
business_rationale: Release gate; regressions block all merges.
priority:           Critical
risk_class:         Verification of a high-severity control
dependencies:       [HD-CLIN-PLAT-000001]
acceptance_criteria:
  - Suite runs in CI on every PR and must be green to merge.
  - Tier-3 recall >= 99%; dosing/diagnosis hard-block = 100%.
  - Includes red-team transcripts and injection cases.
fhir_mapping:       n/a
db_mapping:         n/a
api_mapping:        exercises API_ POST /v1/coach/turn guardrails
ui_mapping:         n/a
test_case_ids:      [self]
guideline_refs:     []
owner:              QA Lead / CMO
approval_status:    Draft
version_history:
  - {version: 1.0.0, date: on-issue, change: "seed record", by: QA Lead}
```

---

## Allocation rules (normative)

1. To create a requirement, take the **Next free** number for its `(TYPE, DOMAIN)`
   pair, then increment the counter in the same PR (`HD-STD-DOC-0020`).
2. Fill **every** RMS field; use `n/a` with a reason where a field genuinely does
   not apply — never leave a field blank (`HD-STD-DOC-0023`).
3. Link each requirement to at least one `HD-TEST-*` record before it can reach
   `Approved` (`HD-STD-DOC-0023`).
4. To retire a requirement, set `approval_status: Deprecated`, add the superseding
   ID, and keep the record — never delete or renumber (`HD-STD-DOC-0030`).
