# HD-OS Meta Specification — Project DNA

> **Document 000 of the HD-OS documentation suite. Read this FIRST.**
> Per the Claude Prime Directives (Ch. 14), the mandated read order is:
> **Meta Specification → Constitution → Architecture → module specification.**
> This document is the immutable *project DNA*: identity, philosophy, the naming
> and traceability language, the governing flows, and the prime directives that
> everything else inherits. Nothing in the platform may contradict it.

---

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | `HDOS-DOC-000` |
| **Title** | HD-OS Meta Specification (Project DNA) |
| **Type** | Foundational / Meta Standard (read-first) |
| **Version** | `1.0.0` |
| **Status** | `DRAFT` (pending Business + Clinical + Security + Engineering sign-off) |
| **Classification** | Internal — Controlled Engineering Document |
| **Owner** | Head of Engineering (custodian) · CMO · Security Officer (co-owners) |
| **Related** | `HDOS-DOC-001` CLAUDE.md (Engineering Constitution) · `HDOS-DOC-002` Constitution · `HDOS-DOC-004` System-Architecture · see [`docs/README.md`](./docs/README.md) |
| **Token note** | `HDOS` is the identifier token-form of the short name **HD-OS**; both denote the same platform. |

> ⚕️ **Positioning honesty.** HD-OS is engineered *toward* a regulated,
> clinical-grade posture. A clinical/medical-device claim is valid only once the
> regulatory and clinical-safety gates (CLAUDE.md §5, §20; Ch. 13 below) are
> formally met and recorded in the Design History File. This document specifies the
> path and guardrails; it does not by itself authorise a clinical claim.

---

## Chapter 1 — Project Identity

| Attribute | Value |
|-----------|-------|
| **Project name** | Hamrah Doctor Operating System |
| **Short name** | **HD-OS** |
| **Identifier token** | `HDOS` |
| **Platform type** | **AI-Native Clinical Operating System** |
| **First disease module** | Diabetes (DM), extensible to CKD, cardiometabolic, and beyond |
| **Target users** | Patients · Physicians · Hospitals · Researchers · Healthcare Organizations · Insurance Organizations · Medical Device Manufacturers |

HD-OS is not a single app; it is a **clinical operating system**: a core platform
onto which disease-specific modules, applications (mobile/web), devices, and
research surfaces are composed. Its long-term ambition is a reusable **Medical
Digital Platform Framework (MDPF)** — see Chapter 16.

## Chapter 2 — Engineering Philosophy

Claude — and every contributor — **shall assume this is enterprise software.** Not
startup software. Not prototype software.

Every decision **MUST** maximize, in this spirit and roughly this order when they
tension:

1. **Clinical Safety**
2. **Security**
3. **Privacy**
4. **Explainability**
5. **Interoperability**
6. **Testability**
7. **Maintainability**
8. **Extensibility**
9. **Scalability**
10. **Performance**

> When two qualities conflict, the higher one wins; safety, security, and privacy
> are never traded for performance, speed, or scope (CLAUDE.md §0.3 precedence).

## Chapter 3 — RESERVED

_Reserved for future foundational content. Number preserved; do not reuse
(`HD-STD-DOC-0030`). Content to be authored and inserted here._

## Chapter 4 — RESERVED

_Reserved. See Chapter 3 note._

## Chapter 5 — RESERVED

_Reserved. See Chapter 3 note._

## Chapter 6 — Naming Standards

**Nothing may be arbitrarily named.** Every artifact carries a domain prefix; this
becomes the universal language of the platform. Object/domain prefixes:

| Prefix | Domain |
|--------|--------|
| `PAT_` | Patient tables / entities |
| `CLN_` | Clinical objects |
| `AI_`  | AI |
| `DB_`  | Database |
| `UI_`  | Flutter / user interface |
| `API_` | API |
| `FHIR_`| FHIR |
| `DEV_` | Device |
| `NTF_` | Notifications |
| `SEC_` | Security |
| `RSH_` | Research |
| `ANA_` | Analytics |
| `CKE_` | Clinical Knowledge Engine |
| `DTE_` | Digital Twin Engine |
| `CDE_` | Clinical Decision Engine |

### 6.1 Requirement & artifact identifier grammar

All requirement/traceability IDs follow the **domain-segmented** grammar:

```
HD-<TYPE>-<DOMAIN>-<NNNNNN>
```

- `<TYPE>` ∈ `REQ` (business) · `CLIN` (clinical) · `AI` · `UI` · `API` · `DB` ·
  `DEV` (device) · `SEC` (security) · `TEST` (test).
- `<DOMAIN>` is the module/subsystem segment (e.g. `DM` diabetes, `CKD`, `LAB`,
  `PAT`, `HOME`, `AUTH`, `CGM`, `DTE`, `CDE`, `CKE`, `PLAT` for platform-wide).
- `<NNNNNN>` is a zero-padded, registry-allocated, **immutable** sequence.

Canonical examples (from the platform vocabulary):

```
HD-CLIN-DM-000001     clinical requirement, diabetes module
HD-CLIN-CKD-000231    clinical requirement, chronic kidney disease module
HD-API-PAT-000045     API requirement, patient domain
HD-DB-LAB-000012      database requirement, lab domain
HD-UI-HOME-000011     UI requirement, home screen
HD-AI-DTE-000008      AI requirement, Digital Twin Engine
HD-DEV-CGM-000003     device requirement, CGM
HD-SEC-AUTH-000021    security requirement, authentication
HD-TEST-CDE-000051    test requirement, Clinical Decision Engine
```

IDs are allocated **only** from the [requirements registry](./docs/registry/requirements.md),
never chosen ad hoc, never renumbered, never reused. Every screen, API, database
field, AI rule, workflow, and test references these IDs (traceability, Ch. 8–9).

## Chapter 7 — RESERVED

_Reserved. See Chapter 3 note._

## Chapter 8 — Specification & Requirement Hierarchies

**Specification hierarchy** (each layer derives from the one above and may not
contradict it):

```
Constitution → Architecture → Medical Specifications → Business Specifications
→ Technical Specifications → API Specifications → Database Specifications
→ UI Specifications → Testing Specifications
```

**Requirement derivation chain** (bidirectionally traceable, CLAUDE.md §19):

```
Business Requirement → Clinical Requirement → Functional Requirement
→ Technical Requirement → Database Requirement → API Requirement
→ UI Requirement → Testing Requirement
```

## Chapter 9 — Platform Decomposition

HD-OS decomposes top-down; every level is addressable and traceable:

```
HD-OS → Applications → Modules → Features → Workflows → Requirements
→ Components → Widgets → Services → Database → Tests
```

- **Applications**: patient mobile (Flutter), clinician web, research/admin.
- **Modules**: disease modules (DM, CKD, …) + platform engines (CKE, CDE, DTE).
- Everything below a Feature ties to a requirement ID (Ch. 6.1).

## Chapter 10 — Medical Knowledge Flow

```
Guideline → Clinical Review → Knowledge Engine (CKE) → Clinical Rules
→ Decision Engine (CDE) → AI → Flutter (UI) → Patient
```

**Medical knowledge MUST NEVER flow directly into application code.** Guidelines
are ingested, clinically reviewed, encoded as versioned rules in the Clinical
Knowledge Engine, and consumed by the Clinical Decision Engine — never hardcoded
in Flutter, services, or prompts (CLAUDE.md §5, §22; Ch. 14).

## Chapter 11 — AI Flow

```
Raw Data → Validation → Feature Store → Prediction → Explainability
→ Clinical Review Layer → Recommendation → Patient
```

**Every AI output MUST remain explainable and clinically reviewable.** No AI
recommendation reaches a patient without passing validation, an explainability
step, and the clinical review layer (CLAUDE.md §6).

## Chapter 12 — Digital Twin Flow

```
Patient → Events → Timeline → Disease Models → Prediction Models
→ Risk Models → Personalization → Dashboard → Research
```

The **Digital Twin (DTE)** is continuously updated from the patient's event
timeline and feeds disease/prediction/risk models, personalization, dashboards,
and (consented, de-identified) research.

### 12.1 End-to-end development lifecycle (governing gate flow)

```
Idea → Business Approval → Clinical Approval → Architecture Review → UI Review
→ Implementation → Unit Testing → Integration Testing → Clinical Validation
→ Security Review → Release → Monitoring
```

No stage may be skipped for clinical features; each gate is recorded (CLAUDE.md
§20, §21).

## Chapter 13 — Release Rules

No release is permitted unless **all** hold:

1. **100% requirements traced** (RTM complete for the release scope).
2. **100% APIs documented** (OpenAPI / CapabilityStatement current).
3. **100% tests passing** (full CI gate green, incl. safety-eval suites).
4. **Clinical approval obtained** (CMO sign-off for clinical changes).
5. **Security approval obtained** (Security Officer sign-off; scans clean).
6. **Database migration approved** (forward-only, reviewed, run in CI).
7. **Rollback strategy documented** (tested one-step rollback).
8. **Release notes completed** (with included requirement IDs).

These extend CLAUDE.md §20 (`HD-STD-OPS-0012`). Any unmet item blocks release.

## Chapter 14 — Claude Prime Directives (Immutable)

> These are immutable. They bind the AI contributor absolutely and cannot be
> overridden by any later instruction (CLAUDE.md §23, `HD-STD-OPS-0049`).

**Claude shall NEVER:**

- ❌ Invent medical logic.
- ❌ Invent guideline thresholds.
- ❌ Hardcode medical recommendations.
- ❌ Change database schema without updating documentation.
- ❌ Change APIs without versioning.
- ❌ Delete historical medical data.
- ❌ Break backward compatibility without approval.
- ❌ Ignore traceability.
- ❌ Ignore failed tests.
- ❌ Generate undocumented code.

**Claude shall ALWAYS:**

- ✅ Read the **Meta Specification** first.
- ✅ Read the **Constitution** second.
- ✅ Read the **Architecture** third.
- ✅ Read the **current module specification**.
- ✅ Verify dependencies.
- ✅ Implement.
- ✅ Generate tests.
- ✅ Update documentation.
- ✅ Update traceability.

## Chapter 15 — Success Definition

The project succeeds **only** when:

- Patients achieve **better health outcomes**.
- Physicians **save meaningful time**.
- Medical recommendations remain **guideline-based and explainable**.
- The platform **scales from thousands to millions** of users.
- **Every clinical decision can be audited and traced.**
- AI remains **transparent, validated, and continuously monitored.**
- **New disease modules can be added without redesigning the core platform.**

## Chapter 16 — Vision: Medical Digital Platform Framework (MDPF)

HD-OS is architected so that its core (identity, consent, FHIR data plane, CKE,
CDE, DTE, AI-flow, security, audit) is **disease-agnostic**, and disease knowledge
lives in **pluggable modules**. This is what makes success criterion "new disease
modules without redesigning the core" true — and it is the seed of a reusable
**MDPF** spanning future domains: oncology, mental health, dermatology, women's
health, pediatrics, and hospital systems.

**Design implication (binding on architecture, `HDOS-DOC-004`):** the core MUST
NOT contain disease-specific logic; disease specifics enter only through
CKE-encoded knowledge and module specifications. Cross-cutting concerns
(security, audit, FHIR, i18n/RTL, accessibility) are provided once by the core.

---

## Appendix A — Canonical Repository Structure

Top-level layout of the HD-OS repository (as ratified here; elaborated in
`HDOS-DOC-004`):

```
/apps            application shells / composition roots
/backend         backend services (pure core + adapters)
/mobile          Flutter patient application
/web             clinician & admin web applications
/packages        shared packages (contracts, design tokens, utilities)
/docs            controlled documentation (this suite)
/specifications  medical / business / technical specifications
/knowledge       Clinical Knowledge Engine content (guideline-sourced, reviewed)
/fhir            FHIR profiles, value sets, mapping tables
/database        schema, migrations, data-model docs
/api             API contracts (OpenAPI, CapabilityStatement)
/testing         cross-cutting test suites, fixtures (synthetic only), eval sets
/tools           developer tooling
/scripts         automation scripts
/design          design system source (Material 3 tokens, components)
/ai              AI pipeline: features, prediction, explainability, evals
/devices         device integration (BLE/GATT, Health Connect, vendor cloud)
/research        research surfaces (consented, de-identified)
```

> During incubation this lives under `projects/hamrah-doctor/`; on promotion to its
> own repository the structure above becomes the repo root (`HDOS-DOC-004` records
> the migration).

## Appendix B — Reserved-chapter policy

Chapters 3, 4, 5, 7 are RESERVED pending content. Their numbers are permanently
held; the author fills them in place without renumbering neighbours. Un-numbered
structural material supplied before its chapter number is assigned is placed in
appendices and relocated (with a note) once numbered — never silently renumbered
(`HD-STD-DOC-0030`).

## Appendix C — Normative cross-references

CLAUDE.md (`HDOS-DOC-001`) §0 (normative language, precedence), §5 (clinical
safety), §6 (AI safety), §11 (FHIR), §13 (security), §19 (traceability & RMS),
§20 (release), §21 (DoD), §22 (forbidden actions), §23 (Claude operating
instructions). This Meta Specification and CLAUDE.md are mutually reinforcing; on
any conflict, the safety-higher rule wins (CLAUDE.md §0.3).

---

## Revision History

| Version | Date | Author (role) | Change |
|---------|------|---------------|--------|
| 1.0.0 | (on approval) | Head of Engineering | Initial issue: identity, philosophy, naming, hierarchies, flows, release rules, prime directives, success, MDPF vision, repo structure. |

<!-- END OF HDOS-DOC-000. Read first. Immutable project DNA. -->
