# CLAUDE.md — HD-OS Engineering Constitution

> **Document 001 of the Hamrah Doctor Operating System (HD-OS) documentation suite.**
> This is the operational engineering constitution. Claude Code — and every human
> contributor — **MUST** load this file first; it binds you to the **Meta
> Specification** (`HDOS-DOC-000`, project DNA) and the immutable **Claude Prime
> Directives** (Meta Spec Ch. 14). The mandated read order is
> **Meta Specification → this Constitution → Architecture → module spec** (§23).
> Nothing that violates this document or the Meta Specification may be merged.
>
> _`HDOS` is the identifier token-form of the short name **HD-OS**; both denote the
> same platform: the **AI-Native Clinical Operating System**._

---

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | `HDOS-DOC-001` |
| **Title** | Hamrah Doctor Engineering Constitution (CLAUDE.md) |
| **Type** | Governance / Master Standard |
| **Version** | `1.0.0` |
| **Status** | `DRAFT` (pending clinical + security + engineering sign-off) |
| **Classification** | Internal — Controlled Engineering Document |
| **Owner** | Head of Engineering (HDOS) |
| **Approvers** | Chief Medical Officer · Security & Privacy Officer · QA Lead · Head of Engineering |
| **Effective date** | On approval |
| **Review cadence** | Every release train, and on any change to a normative rule |
| **Supersedes** | — (initial issue) |
| **Regulatory context** | Class II medical device software (target); IEC 62304, ISO 13485, ISO 14971, IEC 62366-1, HIPAA, GDPR, ISO/IEC 27001 |
| **Related documents** | `HDOS-DOC-000` Meta Specification (read first) · `-002` Constitution · `-003` Product-Vision · `-004` System-Architecture · `-005` Clinical-Architecture · `-006` Database-Architecture (see `docs/README.md` for the full register) |

> ⚕️ **Positioning honesty.** Hamrah Doctor is being engineered *toward* a
> regulated, clinical-grade posture. A clinical or medical-device claim is
> **only** valid once the regulatory and clinical-safety gates named in this
> document (§5, §20) are formally met and recorded in the Design History File
> (DHF). Until then, any deployed build is pre-clinical and must be labelled as
> such. This document specifies the *path* and the *guardrails*; it does not, by
> its existence, authorise a clinical claim.

---

## 0. How to Read and Apply This Document

### 0.1 Normative language
This document uses **RFC 2119 / RFC 8174** keywords. When capitalised they carry
their formal meaning:

- **MUST** / **MUST NOT** — an absolute requirement or prohibition. A violation
  blocks merge and, if in production, is an incident.
- **SHOULD** / **SHOULD NOT** — a strong default. Deviating requires a written,
  reviewer-approved rationale recorded in the PR and, where architectural, an ADR.
- **MAY** — a genuinely optional choice.

Lowercase "must", "should", etc. are prose, not normative.

### 0.2 Rule identifiers
Every normative rule in this document carries a stable identifier of the form:

```
HD-STD-<AREA>-NNNN
```

where `<AREA>` is the section domain (e.g. `CODE`, `FLUT`, `BE`, `DB`, `FHIR`,
`API`, `SEC`, `UI`, `A11Y`, `TEST`, `GIT`, `DOC`, `SAFE`, `AI`, `OPS`) and `NNNN`
is a zero-padded sequence. **Rule IDs are immutable.** A withdrawn rule is marked
`DEPRECATED` and kept; its number is never reused. Reference rule IDs in code
comments, commit messages, PRs, ADRs, and reviews (e.g. *"enforces
`HD-STD-SEC-0007`"*).

Rule IDs (`HD-STD-*`) govern *how we build*. Requirement IDs (`HD-REQ-*`,
`HD-CLIN-*`, …; see §19) govern *what we build*. Both are traceable; they are
different registries.

### 0.3 Precedence order (when documents conflict)
1. Applicable **law and regulation** (HIPAA, GDPR, Iranian data-protection law,
   medical-device regulation of the target market).
2. **Patient safety** (this document §5, §6; ISO 14971 risk controls).
3. **This document** (`HDOS-DOC-001`).
4. The **HDOS Constitution** (`HDOS-DOC-002`) and architecture documents.
5. Volume/feature specifications and requirement records.
6. Team conventions and individual PR preferences.

If a lower item conflicts with a higher item, the higher item wins and the lower
item **MUST** be corrected. Never resolve a conflict by weakening safety.

### 0.4 Deviation protocol
`HD-STD-OPS-0001` — Any deviation from a **MUST** requires: (a) a documented
safety/impact rationale, (b) written approval from the rule's domain owner, (c) a
tracked remediation item with a due date, and (d) a note in the affected
requirement record's version history. Deviations from a **MUST** in §5 or §6
(clinical/AI safety) additionally require CMO sign-off.

---

## 1. Mission

`HD-REQ-PLAT-000001` **Mission.** Hamrah Doctor Operating System (HD-OS,
"همراه دکتر" — *companion doctor*) is an **AI-Native Clinical Operating System**: a
clinical-grade platform that helps people living with chronic conditions —
beginning with **diabetes** — understand, manage, and improve their health in
partnership with their clinicians, through trustworthy data, safe guidance, and
continuous, cause-and-effect feedback about how everyday choices affect their
body. It serves patients, physicians, hospitals, researchers, healthcare and
insurance organizations, and medical-device manufacturers on one FHIR-native,
disease-extensible core.

`HD-STD-SAFE-0001` The mission is **safety-first**: the platform's first
obligation is never to harm. Utility, engagement, and growth are subordinate to
patient safety and data protection in every decision.

The platform's first-class product surfaces (each serving actors named above):

- **Patients** — a mobile-first companion (Flutter) for logging, learning,
  device-connected measurements, and a safety-guardrailed AI health coach.
- **Clinicians** — a web panel for roster management, longitudinal review
  (AGP, organ-impact, risk), decision support, and secure messaging.
- **The care system** — FHIR-native services, device integration, audit, and
  compliance that let Hamrah Doctor interoperate with the wider health ecosystem.

## 2. Vision

`HD-REQ-PLAT-000002` **Vision.** A world where every person with a chronic condition
carries a trustworthy, always-available health companion that (a) makes the
invisible consequences of daily choices *visible and intuitive*, (b) closes the
loop with real clinicians before any risk becomes harm, and (c) treats the
patient's data as a fiduciary responsibility, not an asset to be exploited.

North-star principles behind the vision:

- **Comprehension over compliance.** We aim for patients to *understand* their
  condition, not merely obey instructions.
- **Human-in-the-loop by design.** Software augments clinicians; it never
  replaces clinical judgment on diagnosis, dosing, or prescription.
- **Interoperable and portable.** Data belongs to the patient and moves with
  them (FHIR R4, export, DSAR).
- **Equitable and localized.** First-class **Persian (Farsi) RTL** experience and
  accessibility (WCAG 2.2 AA) are requirements, not afterthoughts.
- **Earned trust.** Every clinical and AI behaviour is verifiable, auditable, and
  reversible.

## 3. Development Philosophy

`HD-STD-CODE-0001` **Specification-driven.** No non-trivial code is written
without a requirement record (§19) it satisfies. Code cites the requirement; the
requirement cites its tests. Speculative features are forbidden (§22).

`HD-STD-CODE-0002` **Verification-driven (test-first for logic).** Clinical,
safety, financial, and data-integrity logic is developed test-first. A change is
"done" only when its verifying tests exist, run in CI, and pass (§16, §21).

`HD-STD-CODE-0003` **No unverified code merges.** Every merge must typecheck,
lint, build, and pass the full gate. "It compiles on my machine" is not
verification.

`HD-STD-CODE-0004` **Small, reversible changes.** Prefer small PRs with a single
clear intent. Every change must be revertable without a cascade. Large changes are
decomposed into independently shippable, independently verifiable steps.

`HD-STD-CODE-0005` **Documentation-as-code.** Behaviour and its documentation
change in the *same* commit. A PR that changes behaviour without updating the
affected spec/requirement/doc is incomplete.

`HD-STD-CODE-0006` **No placeholders in merged code.** No `TODO`, `FIXME`,
`// rest of code here`, stubbed returns, or dead branches in merged work.
In-progress work lives on a branch, behind a flag, or not at all.

`HD-STD-CODE-0007` **Fail safe, fail loud.** On ambiguity or error in a
safety-relevant path, the system defaults to the safest behaviour and surfaces
the failure; it never silently guesses (see §5, §6).

`HD-STD-CODE-0008` **Simulation ≠ clinical truth.** Any teaching/simulation model
(e.g. organ-impact visualisation) is architecturally and visually separated from
real clinical data and is labelled as educational. The two data lineages never
merge.

`HD-STD-CODE-0009` **Reproducibility.** Builds, tests, and environments are
deterministic and pinned (lockfiles committed, versions pinned, seeds fixed).

## 4. Architecture Principles

`HD-STD-CODE-0020` **Hexagonal / ports-and-adapters.** Each service has a **pure
domain core** with no I/O, wrapped by adapters (HTTP, DB, device, model
provider). Core logic is unit-testable without a network, DB, or clock. (This is
already the proven pattern in the seed prototype's `core/` vs `infra/` split.)

`HD-STD-CODE-0021` **Domain-driven boundaries.** Modules are organised by clinical
domain (observations, medications, coaching, devices, identity, consent), not by
technical layer alone. Shared contracts live in one `shared` package that is the
single source of truth for cross-service types.

`HD-STD-CODE-0022` **FHIR-native.** The canonical clinical data model is HL7 FHIR
R4 (§11). Internal models map to FHIR resources; we do not invent parallel
clinical schemas.

`HD-STD-CODE-0023` **Offline-first patient app.** The patient app is fully usable
offline; sync is opt-in, idempotent, and conflict-aware. Nothing leaves the
device without explicit consent.

`HD-STD-CODE-0024` **Security- and privacy-by-design.** Threat modelling,
data-minimisation, encryption, and least privilege are designed in from the first
line, not bolted on (§13).

`HD-STD-CODE-0025` **API-first / contract-first.** Service boundaries are defined
by versioned, published contracts (OpenAPI + FHIR CapabilityStatement) before
implementation (§12).

`HD-STD-CODE-0026` **Deterministic safety layer.** Safety guardrails (clinical
and AI) are implemented as deterministic code that sits *in front of* and can
*override* any probabilistic component. A model is never the last line of defence.

`HD-STD-CODE-0027` **Evolvability.** Start as a modular monolith per service
boundary; extract services only when a real scaling or ownership boundary demands
it. Complexity must be justified by a requirement, not by fashion.

`HD-STD-CODE-0028` **Observability as a feature.** Every service emits structured
logs (PHI-free, §13), metrics, and traces sufficient to diagnose incidents and
to reconstruct any clinical decision path for audit.

## 5. Clinical Safety Rules

> These rules are **safety-critical**. A violation is a potential patient-harm
> event and is treated as a Sev-1 incident. CMO owns this section.

`HD-STD-SAFE-0010` **No autonomous diagnosis.** The software MUST NOT present a
diagnosis as fact. It may surface *observations*, *risk indicators*, and
*educational* information, always framed as non-diagnostic and always routed to a
clinician for interpretation.

`HD-STD-SAFE-0011` **No autonomous dosing or prescribing.** The software MUST NOT
compute, recommend, adjust, or confirm medication doses, insulin titration, or
prescriptions. Any such user request is hard-blocked and redirected to a
clinician (see §6 for the AI-specific control).

`HD-STD-SAFE-0012` **Red-flag escalation.** Defined red-flag conditions (e.g.
severe hypo/hyperglycaemia, DKA symptoms, cardiac/stroke warning signs, suicidal
ideation) MUST trigger an immediate, deterministic escalation path (emergency
guidance + clinician/human notification) that does **not** depend on a model
decision. Escalation logic is covered by a safety-eval suite with a defined
minimum recall gate (§16).

`HD-STD-SAFE-0013` **Human-in-the-loop for clinical actions.** Any action that
could influence treatment (message to a patient framed as clinical advice, care
plan change, alert acknowledgement) MUST be attributable to, and where required
approved by, a licensed clinician.

`HD-STD-SAFE-0014` **ISO 14971 risk management.** Every clinical feature has a
risk analysis entry (hazard, harm, severity, probability, risk control,
residual-risk verification). Risk controls are traced to code and tests. No
clinical feature ships without its risk file entry closed.

`HD-STD-SAFE-0015` **Units and precision safety.** Clinical quantities MUST carry
explicit units (e.g. `mg/dL` vs `mmol/L`), be converted through a single audited
utility, be range-validated, and be rendered with clinically correct precision.
Ambiguous or out-of-physiological-range values are rejected, never coerced.

`HD-STD-SAFE-0016` **Source-of-truth integrity.** Real measurements (device or
clinician-entered) are immutable once recorded; corrections are additive
(new record + supersedes link), never destructive. The educational simulation
MUST NOT write into, or be mistaken for, the clinical record.

`HD-STD-SAFE-0017` **Fail-safe defaults.** If clinical data is missing, stale,
uncertain, or in error, the system shows an explicit "unknown / unavailable"
state and the safest guidance — never a fabricated or optimistic value.

`HD-STD-SAFE-0018` **Alarm/notification discipline.** Safety notifications are
distinguishable, non-suppressible for the highest tier, and never rely on colour
alone (§14, §15). Alert fatigue is a safety hazard and is actively managed.

`HD-STD-SAFE-0019` **Clinical content provenance.** All clinical/educational
content cites its guideline source (e.g. ADA, WHO, NICE) and carries a reviewer
and review date. Unsourced clinical claims MUST NOT ship.

`HD-STD-SAFE-0020` **Clinical validation gate.** Before any clinically-labelled
release, a designated clinician reviews and signs off the clinical behaviour set;
the sign-off is recorded in the DHF and referenced by the release record (§20).

## 6. AI Safety Rules

> The AI Health Coach is a high-risk subsystem. Its safety derives from
> deterministic guardrails, not from the model's good behaviour.

`HD-STD-AI-0001` **Guardrails precede and override the model.** A deterministic
safety layer classifies every user turn *before* the model is called and every
model output *before* it reaches the user. It can block, rewrite, or escalate
independently of the model. The model is never the final authority.

`HD-STD-AI-0002` **Hard-blocked intents.** Dosing/titration/prescription
requests, diagnosis requests, and requests to override safety are hard-blocked
with a fixed, safe response and a clinician redirect — even offline, even if the
network or model is unavailable.

`HD-STD-AI-0003` **Red-flag detection is deterministic.** Emergency/red-flag
detection (§5) runs in code, not only in the prompt, and escalates regardless of
what the model returns. Target: ≥99% recall on the labelled Tier-3 safety set
before any release (§16).

`HD-STD-AI-0004` **Grounding and anti-hallucination.** Clinical statements the
coach makes MUST be grounded in vetted, cited content (retrieval over an approved
knowledge base) or refused. The coach says "I don't know / please ask your
clinician" rather than inventing. No fabricated numbers, studies, or drug facts.

`HD-STD-AI-0005` **No PHI leakage into models.** Prompts sent to any model
provider are minimised and de-identified to the extent the feature allows;
provider data-handling terms MUST meet the platform's PHI requirements (BAA/DPA).
Never place secrets or unnecessary identifiers in a prompt.

`HD-STD-AI-0006` **Prompt-injection defence.** Untrusted content (user text,
retrieved documents, device data) is treated as data, never as instructions.
System instructions and safety rules cannot be overridden by conversation
content. Injection attempts are logged.

`HD-STD-AI-0007` **Scope confinement.** The coach only performs educational
coaching and safe triage. It MUST NOT take clinical actions, write to the
clinical record, or claim clinician authority. Tool access is least-privilege.

`HD-STD-AI-0008` **Evaluation gate.** The coach is gated by an automated eval
suite (safety recall, refusal correctness, groundedness, tone, injection
resistance). Red-team transcripts are part of the suite. Regressions block
release.

`HD-STD-AI-0009` **Transparency.** Users are clearly told they are talking to an
AI coach, its limits, and how to reach a human. AI-authored content is labelled.

`HD-STD-AI-0010` **Model governance.** Model choice, version, parameters, prompt
templates, and knowledge-base versions are pinned, versioned, and recorded per
release. A model/version change is a reviewable, re-evaluated change, not a silent
swap.

## 7. Coding Standards (General)

`HD-STD-CODE-0040` **Readability first.** Code is written for the next human. New
code matches the surrounding file's naming, structure, and idiom. Cleverness that
costs clarity is rejected.

`HD-STD-CODE-0041` **Naming.** Names are descriptive and domain-accurate. No
abbreviations for clinical terms. Booleans read as predicates (`isEscalated`).
Units appear in names where ambiguous (`glucoseMgDl`).

`HD-STD-CODE-0042` **Small, single-purpose functions.** Functions do one thing.
Guideline: ≤ ~40 logical lines and cyclomatic complexity ≤ 10 unless justified.
Deeply nested conditionals are refactored to guard clauses.

`HD-STD-CODE-0043` **Pure core, impure edges.** Business rules are pure functions
(no I/O, no ambient clock/random). Time and randomness are injected. This is what
makes clinical logic deterministically testable.

`HD-STD-CODE-0044` **Explicit error handling.** Errors are typed and handled at a
defined boundary. No empty catches, no swallowing, no error-as-control-flow.
User-facing errors never leak internals or PHI.

`HD-STD-CODE-0045` **Immutability by default.** Prefer immutable data and pure
transformations. Mutation is local and intentional.

`HD-STD-CODE-0046` **No magic values.** Clinical thresholds, limits, and codes are
named constants sourced from a single, cited location — never inline literals.

`HD-STD-CODE-0047` **Strict typing.** Strict mode is on; no implicit `any`/dynamic
in typed languages. Public boundaries are fully typed. Nullability is explicit.

`HD-STD-CODE-0048` **Dependency hygiene.** New runtime dependencies require
justification and a license/security review. Prefer the standard library. Pin
versions; commit lockfiles. Remove unused deps.

`HD-STD-CODE-0049` **Logging discipline.** Structured logs only; **never** log
PHI, secrets, tokens, or full request bodies (§13). Log requirement/rule IDs and
correlation IDs, not patient identities.

`HD-STD-CODE-0050` **Internationalisation.** No user-facing string is hardcoded;
all go through i18n with Farsi + English at minimum, RTL-aware. Dates, numbers,
and units are locale- and unit-aware.

`HD-STD-CODE-0051` **Comments explain *why*.** Comments justify non-obvious
decisions and cite requirement/rule IDs; they don't restate the code.

## 8. Flutter Standards (Patient App)

`HD-STD-FLUT-0001` **Language & lints.** Dart, latest stable SDK. `flutter_lints`
+ project-strict analysis options; `flutter analyze` is a CI gate with zero
warnings tolerated on changed files.

`HD-STD-FLUT-0002` **Architecture.** Clean layering: `presentation` (widgets) →
`application` (state/use-cases) → `domain` (pure models & rules) → `data`
(repositories/adapters). Domain has **no** Flutter imports and is unit-tested in
isolation. This mirrors §4's hexagonal rule.

`HD-STD-FLUT-0003` **State management.** One sanctioned solution across the app —
**Riverpod** (ratified in `HDOS-DOC-004`). No mixing of competing state
frameworks. Global mutable singletons are forbidden.

`HD-STD-FLUT-0004` **No business logic in widgets.** Widgets render state and emit
intents. Clinical/business rules live in `domain`/`application`, never in
`build()`.

`HD-STD-FLUT-0005` **Design tokens & theming.** All colour, spacing, typography,
and radii come from the Material 3 token set (§14). No hardcoded colours or
magic paddings in widgets.

`HD-STD-FLUT-0006` **Accessibility semantics.** Every interactive widget has
semantics, a label, and a ≥48dp touch target; supports dynamic text scaling and
screen readers (§15). Golden tests include large-text and RTL variants.

`HD-STD-FLUT-0007` **RTL & localisation.** The app is built RTL-first for Farsi;
all layouts pass in both directions. No `EdgeInsets.only(left: …)` where a
directional (`start`/`end`) inset is correct.

`HD-STD-FLUT-0008` **Performance.** Avoid rebuild storms (scoped providers, `const`
constructors, keys where needed). No jank on the core loop; long work is async and
off the UI isolate. Lists are virtualised.

`HD-STD-FLUT-0009` **Secure local storage.** PHI at rest on device uses encrypted
storage (platform keystore/secure enclave); no PHI in plain `SharedPreferences`,
logs, or crash reports.

`HD-STD-FLUT-0010` **Offline & sync.** UI is fully functional offline; sync state
is explicit (`local` / `syncing` / `synced` / `error`) and never silently drops
user data (§4, §5).

`HD-STD-FLUT-0011` **Testing.** Widget tests for every screen, golden tests for
key states (loading/empty/error/large-text/RTL/dark), and integration tests for
the core loop (§16).

## 9. Backend Standards

`HD-STD-BE-0001` **Sanctioned stack.** Backend services are TypeScript on Node
(strict mode) with a typed HTTP framework, or a language ratified in
`HDOS-DOC-004`. The choice is recorded via ADR; no unratified runtimes in
production paths. (The seed prototype's typed service cores establish this
pattern.)

`HD-STD-BE-0002` **Pure core + adapters.** Each service is a pure domain core
(`core/`) plus infra adapters (`infra/`) and a thin server entry. Handlers
validate, delegate to the core, and serialise — no business logic in transport
code.

`HD-STD-BE-0003` **Input validation at the boundary.** Every external input is
schema-validated before use. Reject unknown fields on clinical writes. Never trust
client-supplied identity, role, or timestamps for authorization.

`HD-STD-BE-0004` **Idempotency.** All create/sync endpoints accept an idempotency
key and are safe to retry; duplicates are de-duplicated, never double-written
(critical for observations — a duplicated glucose reading is a safety issue).

`HD-STD-BE-0005` **Consistent error model.** Errors use RFC 7807
(`application/problem+json`) with stable, documented codes; no stack traces or PHI
in responses.

`HD-STD-BE-0006` **AuthN/Z on every route.** No endpoint is public by default.
Authorization is checked server-side against consent and role for every request
(§13). Consent-gating for patient data is mandatory.

`HD-STD-BE-0007` **Observability.** Structured, correlation-ID'd, PHI-free logs;
health/readiness endpoints; metrics and traces; audit events for every access to
patient data.

`HD-STD-BE-0008` **Configuration & secrets.** Config via environment/secret
manager; no secrets in code, images, or logs. Fail closed if a required secret is
absent.

`HD-STD-BE-0009` **Background work.** Long/async work runs in queues/workers with
retries, backoff, dead-lettering, and idempotent handlers.

`HD-STD-BE-0010` **Backward compatibility.** Breaking an API contract requires a
new version and a deprecation window (§12).

## 10. Database Standards

`HD-STD-DB-0001` **Engine & access.** PostgreSQL as the system of record. Access
via typed repositories; no ad-hoc SQL string concatenation (parameterised queries
only — SQL injection is prohibited by construction).

`HD-STD-DB-0002` **Naming & schema.** `snake_case` tables/columns; singular domain
nouns; explicit foreign keys; every table has `id`, `created_at`, and (where
mutable) `updated_at`. Enumerations are constrained.

`HD-STD-DB-0003` **Forward-only migrations.** Schema changes are versioned,
reviewed, forward-only migrations checked into the repo and run in CI against a
real database. No manual production schema edits (§22).

`HD-STD-DB-0004` **PHI encryption.** PHI columns are encrypted at rest
(field-level AES-256-GCM for the most sensitive) in addition to volume
encryption; encryption keys are managed by a KMS, never in the DB or code.

`HD-STD-DB-0005` **Auditability & immutability.** Clinical records are
append-only; corrections supersede rather than overwrite (§5). A tamper-evident
audit log (hash-chained) records access and change to patient data.

`HD-STD-DB-0006` **Row-level access.** Access to patient rows is constrained by
consent and role (application-enforced, and RLS where supported). No query returns
patient data without an authorised subject.

`HD-STD-DB-0007` **Indexing & performance.** Access patterns are indexed
deliberately; migrations that add large indexes are concurrent/online. No N+1 in
hot paths.

`HD-STD-DB-0008` **Retention & deletion.** Data-retention and right-to-erasure
(GDPR/DSAR) are implemented as first-class flows; hard-delete vs
crypto-shred policy is defined per data class in `HDOS-DOC-006`.

`HD-STD-DB-0009` **Backups & recovery.** Encrypted, tested backups with a defined
RPO/RTO; restores are rehearsed. Backups inherit the same PHI protections.

## 11. FHIR Standards

`HD-STD-FHIR-0001` **Canonical model.** HL7 **FHIR R4** is the canonical clinical
data model. Clinical concepts are represented as FHIR resources (`Patient`,
`Observation`, `Condition`, `MedicationStatement`, `CarePlan`, `Device`,
`DiagnosticReport`, `Consent`, `Provenance`).

`HD-STD-FHIR-0002` **Terminologies.** Use standard code systems — **LOINC** for
observations/labs, **SNOMED CT** for clinical findings, **ICD-10/11** for
diagnoses, **UCUM** for units, **RxNorm/ATC** for medications. **Never invent
codes.** An unmapped concept is escalated, not fabricated (§22).

`HD-STD-FHIR-0003` **Profiles & bindings.** Resources conform to defined profiles
(align with **US Core** / **International Patient Summary** where applicable);
value-set bindings are explicit and validated.

`HD-STD-FHIR-0004` **Identifiers & provenance.** Stable business identifiers on
resources; every clinical record carries `Provenance` (who/what/when/source —
device vs manual vs derived).

`HD-STD-FHIR-0005` **Validation.** Resources are validated against their profiles
in CI; invalid resources are rejected at the boundary, never persisted.

`HD-STD-FHIR-0006` **Mapping tables.** Every internal↔FHIR mapping is documented
in a mapping table with requirement IDs; changes to mappings are reviewed like
clinical changes.

`HD-STD-FHIR-0007` **Units in FHIR.** Quantities use UCUM units with explicit
system; conversions go through the single audited units utility (§5).

## 12. API Standards

`HD-STD-API-0001` **Contract-first.** Every API is defined by a versioned
**OpenAPI** spec (and a FHIR `CapabilityStatement` for FHIR endpoints) before
implementation; the contract is the source of truth and is tested against.

`HD-STD-API-0002` **Versioning.** APIs are explicitly versioned (`/v1`). Breaking
changes ship under a new version with a published deprecation window; consumers
are never broken silently.

`HD-STD-API-0003` **Auth.** OAuth2 / OIDC; **SMART on FHIR** for clinical/EHR
interop. Tokens are short-lived; scopes are least-privilege; refresh is secure.

`HD-STD-API-0004` **Errors.** RFC 7807 problem+json with stable codes and no PHI.
Validation errors identify the offending field without echoing sensitive values.

`HD-STD-API-0005` **Pagination, filtering, sorting.** List endpoints paginate by
default with stable cursors; no unbounded result sets.

`HD-STD-API-0006` **Idempotency & safety.** Unsafe methods honour idempotency
keys; `GET` is side-effect-free; retries are safe (§9).

`HD-STD-API-0007` **Rate limiting & abuse protection.** All public endpoints are
rate-limited and protected against enumeration and brute force.

`HD-STD-API-0008` **Documentation.** Every endpoint documents its purpose,
auth/scopes, request/response schema, error codes, and the requirement IDs it
implements.

## 13. Security Standards

> Owner: Security & Privacy Officer. Aligns with HIPAA, GDPR, ISO/IEC 27001,
> OWASP ASVS (backend/web) and OWASP MASVS (mobile).

`HD-STD-SEC-0001` **Encryption everywhere.** TLS 1.2+ in transit; AES-256 at rest;
field-level encryption for the most sensitive PHI (§10). No plaintext PHI on any
medium.

`HD-STD-SEC-0002` **Key management.** Keys live in a KMS/HSM; rotation is
scheduled; no keys in code, config files, images, or version control (§22).

`HD-STD-SEC-0003` **Least privilege & zero trust.** Every actor (user, service,
job) gets the minimum access needed; internal calls are authenticated; no implicit
trust by network location.

`HD-STD-SEC-0004` **RBAC/ABAC + consent.** Access to patient data requires the
correct role **and** a valid, current consent grant; both are checked server-side
on every access.

`HD-STD-SEC-0005` **Audit logging.** Every access to and change of PHI is recorded
in a tamper-evident (hash-chained) audit log with actor, subject, action, time,
and reason — sufficient to satisfy HIPAA audit and breach investigation.

`HD-STD-SEC-0006` **Secrets management.** Secrets come from a secret manager,
never source. Secret scanning runs in CI; a committed secret is an incident and
the secret is rotated immediately.

`HD-STD-SEC-0007` **Secure SDLC gates.** SAST, dependency/SCA scanning, secret
scanning, and (for major releases) DAST run in CI. Known high/critical
vulnerabilities block release.

`HD-STD-SEC-0008` **Threat modelling.** Each service/feature has a STRIDE threat
model; identified threats map to controls and tests. Updated when the design
changes.

`HD-STD-SEC-0009` **Data minimisation & privacy.** Collect the least data needed;
pseudonymise/de-identify where possible; purpose-limit processing; honour DSAR
(access, export, erasure) as engineered flows.

`HD-STD-SEC-0010` **Mobile hardening (MASVS).** Certificate pinning where
appropriate, secure storage, no sensitive data in backups/screenshots/logs,
tamper/root awareness for high-risk actions.

`HD-STD-SEC-0011` **Incident response.** A documented IR/breach plan with roles,
timelines, and regulatory-notification obligations; incidents are drilled.
Security events page the on-call.

`HD-STD-SEC-0012` **No PHI in non-prod.** Development and test environments use
synthetic data only. Production PHI never flows to dev/test/analytics without
approved de-identification.

## 14. UI Standards

`HD-STD-UI-0001` **Material Design 3.** Material 3 is the foundation for the
patient app; the clinician web panel shares the same design tokens and data-viz
language for consistency.

`HD-STD-UI-0002` **Tokenised design.** Colour, type, spacing, elevation, motion,
and radius come from named tokens. No raw values in components.

`HD-STD-UI-0003` **Never colour alone.** Status/severity is always encoded by
icon/label/shape *and* colour (safety + accessibility, §5, §15). Clinical ranges
show numeric value + unit + band, not just a colour.

`HD-STD-UI-0004` **Every state designed.** Loading, empty, error, offline, and
success states are explicitly designed for every screen; no dead ends.

`HD-STD-UI-0005` **Clinical data display.** Timestamps show timezone; values show
units and clinically-correct precision; stale data is visibly marked; "unknown" is
a distinct, honest state (§5).

`HD-STD-UI-0006` **RTL + dark mode.** Full RTL (Farsi) and dark-mode support are
requirements; both are covered by golden tests.

`HD-STD-UI-0007` **Tone & content.** Plain, non-alarming, non-shaming language;
motivation grounded in Self-Determination Theory; forgiving streaks (never shame a
user to zero). Clinical wording is reviewed (§5).

`HD-STD-UI-0008` **Motion & feedback.** Motion is purposeful, respects
reduce-motion settings, and never conveys critical info by animation alone.

## 15. Accessibility Standards

`HD-STD-A11Y-0001` **Target: WCAG 2.2 AA.** The whole product targets WCAG 2.2
AA. This is a release gate, not a nice-to-have.

`HD-STD-A11Y-0002` **Contrast.** Text and meaningful UI meet AA contrast ratios in
both light and dark themes; verified by tooling.

`HD-STD-A11Y-0003` **Semantics & screen readers.** All content and controls are
exposed with correct roles/labels/values to TalkBack/VoiceOver; reading order is
logical in LTR and RTL.

`HD-STD-A11Y-0004` **Touch & input.** ≥48dp targets; full keyboard/switch
operability on web; no time-limited interactions without extension.

`HD-STD-A11Y-0005` **Dynamic type & zoom.** Layouts remain usable at 200% text
scaling and browser zoom without loss of content or function.

`HD-STD-A11Y-0006` **No harm from media.** No content flashes above seizure
thresholds; captions/alt text for informative media.

`HD-STD-A11Y-0007` **Testing.** Automated a11y checks in CI plus periodic manual
audits with assistive tech; a11y defects are prioritised as accessibility is a
safety and equity concern.

## 16. Testing Standards

`HD-STD-TEST-0001` **Test pyramid.** Many fast unit tests (pure domain/clinical
logic), fewer integration tests (DB, FHIR, device), fewest E2E. Safety-critical
logic is over-tested.

`HD-STD-TEST-0002` **Coverage gates.** Domain/clinical/safety modules require high
coverage (target ≥90% line + meaningful branch); overall gate defined in
`HDOS-DOC` QA volume. Coverage of safety code is non-negotiable.

`HD-STD-TEST-0003` **Safety-eval suites.** AI guardrails and clinical red-flag
logic have dedicated eval suites with explicit recall/precision gates
(Tier-3 red-flag recall ≥99%; dosing/diagnosis hard-block = 100%). These must stay
green; a regression blocks all merges.

`HD-STD-TEST-0004` **Deterministic tests.** Tests inject time/randomness (§7); no
flakiness, no network to third parties, no reliance on wall-clock or ordering.

`HD-STD-TEST-0005` **Test types by surface.** Flutter: unit + widget + golden +
integration. Backend: unit + contract + integration (real Postgres/FHIR) +
security. Web: unit + component + Playwright E2E.

`HD-STD-TEST-0006` **Clinical validation tests.** Clinical calculations
(TIR, GMI, CV, AGP, risk, unit conversions) are validated against known-good
reference values with citations.

`HD-STD-TEST-0007` **Synthetic data only.** Tests use synthetic patients; never
real PHI (§13).

`HD-STD-TEST-0008` **CI is the gate.** The full suite runs in CI on every PR; a
red gate cannot be merged or released. Property-based and mutation testing are
applied to critical logic where valuable.

`HD-STD-TEST-0009` **Traceability.** Every requirement links to the test(s) that
verify it; the requirements-traceability matrix (RTM) is kept current (§19).

## 17. Git Workflow

`HD-STD-GIT-0001` **Branching.** Short-lived feature branches off the integration
branch; descriptive names (`feature/…`, `fix/…`, `docs/…`). No long-running
divergent forks.

`HD-STD-GIT-0002` **Conventional commits.** Commit messages follow Conventional
Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`) and reference
requirement/rule IDs where relevant. Messages explain *why*.

`HD-STD-GIT-0003` **Protected branches.** `main` (and release branches) are
protected: no direct pushes, no force-push, required green CI, required reviews.

`HD-STD-GIT-0004` **Review requirements.** ≥1 qualified reviewer; safety-critical
(§5/§6), security (§13), or clinical changes require the relevant domain owner's
review. Reviews check compliance with this document.

`HD-STD-GIT-0005` **Clean history & no secrets.** No secrets, PHI, or large
binaries in history; secret scanning gates the push. Squash-merge to keep history
legible unless a curated history is warranted.

`HD-STD-GIT-0006` **Signed & attributable.** Commits are attributable; signed
commits where the platform supports it. CI status is a merge precondition, not a
suggestion.

`HD-STD-GIT-0007` **PRs are complete units.** A PR includes code + tests + docs +
requirement links and passes the full Definition of Done (§21) before merge.

## 18. Documentation Standards

`HD-STD-DOC-0001` **Docs-as-code.** All documentation lives in the repo in
Markdown, reviewed like code, versioned with the change it describes.

`HD-STD-DOC-0002` **Numbered register.** Documents are numbered (`001`, `002`, …)
and listed in `docs/README.md` with ID, title, owner, and status. Numbers are
stable and never reused.

`HD-STD-DOC-0003` **Control block required.** Every document opens with a Document
Control block (ID, version, status, owner, approvers, related docs) like this one.

`HD-STD-DOC-0004` **RMS format for requirements.** Every requirement is recorded
in the Requirements Management System format (§19). Prose that introduces a
requirement without an RMS record is incomplete.

`HD-STD-DOC-0005` **ADRs.** Significant architectural decisions are captured as
Architecture Decision Records (context, decision, alternatives, consequences) and
referenced by the code they govern.

`HD-STD-DOC-0006` **Diagrams.** Architecture uses the **C4** model; sequence and
lifecycle diagrams use Mermaid so they render and diff in Git.

`HD-STD-DOC-0007` **Single source of truth.** A fact lives in exactly one
authoritative document; others link to it. Contradictions are defects.

`HD-STD-DOC-0008` **Living documents.** Docs are updated in the same PR as the
behaviour they describe (§3); stale docs are treated as bugs.

## 19. Requirement Traceability

`HD-STD-DOC-0020` **Requirement ID taxonomy.** Every requirement gets a stable,
immutable, zero-padded ID in one of these registries:

| Prefix | Domain |
|--------|--------|
| `HD-REQ-` | High-level business/product requirement |
| `HD-CLIN-` | Clinical requirement / behaviour |
| `HD-AI-` | AI Health Coach requirement |
| `HD-UI-` | User-interface requirement |
| `HD-API-` | API requirement |
| `HD-DB-` | Database / data-model requirement |
| `HD-DEV-` | Device-integration requirement |
| `HD-SEC-` | Security / privacy requirement |
| `HD-TEST-`| Test / verification requirement |

Requirement IDs use the **domain-segmented grammar** defined in the Meta
Specification (`HDOS-DOC-000` Ch. 6.1): `HD-<TYPE>-<DOMAIN>-<NNNNNN>` (e.g.
`HD-CLIN-DM-000001`, `HD-API-PAT-000045`, `HD-SEC-AUTH-000021`; `<DOMAIN> = PLAT`
for platform-wide requirements). IDs are **allocated from a central registry**
(`docs/registry/requirements.md`), never chosen ad hoc, never renumbered, never
reused. A retired requirement is marked `DEPRECATED` with a superseding ID.

`HD-STD-DOC-0021` **RMS record — the mandatory format.** Every requirement is
documented as a record with **all** of these fields:

```yaml
id:                 HD-CLIN-DM-000001   # HD-<TYPE>-<DOMAIN>-<NNNNNN>
title:              <concise name>
description:        <what is required, testably stated>
clinical_rationale: <why, clinically — or "n/a" with reason>
business_rationale: <why, for the business/user>
priority:           Critical | High | Medium | Low
risk_class:         <ISO 14971 risk classification / severity>
dependencies:       [<requirement IDs this depends on>]
acceptance_criteria:
  - <criterion 1 (testable)>
  - <criterion 2>
fhir_mapping:       <resource/profile/codes, or n/a>
db_mapping:         <table/columns, or n/a>
api_mapping:        <endpoint(s)/contract, or n/a>
ui_mapping:         <screen/component, or n/a>
test_case_ids:      [<HD-TEST-… ids that verify this>]
guideline_refs:     [<ADA/WHO/NICE/… citations, or n/a>]
owner:              <role/person>
approval_status:    Draft | In Review | Approved | Deprecated
version_history:
  - {version: 1.0.0, date: <YYYY-MM-DD>, change: "initial", by: <owner>}
```

`HD-STD-DOC-0022` **Bidirectional traceability.** The chain
**business → clinical → requirement → design → code → test → FHIR/DB/API/UI** is
navigable in both directions. Code cites requirement IDs; requirements cite tests;
the RTM (Requirements Traceability Matrix) is generated and kept current.

`HD-STD-DOC-0023` **No orphans.** No shipped code without a requirement; no
requirement without acceptance criteria and at least one verifying test; no
clinical requirement without a clinical rationale and (where applicable) a
guideline reference.

## 20. Release Process

`HD-STD-OPS-0010` **Semantic versioning & release records.** Products are
SemVer-versioned; every release has a record listing included requirement IDs,
changes, risks, and sign-offs, plus generated release notes.

`HD-STD-OPS-0011` **Environments & promotion.** `dev → staging → production`.
Promotion is gated; production PHI never flows backward (§13). Staging mirrors
production configuration.

`HD-STD-OPS-0012` **Release gates.** A release requires: green full CI (all
gates), security scans clean of high/critical, a11y gate passed, clinical sign-off
for any clinical change (§5), and updated docs/DHF. Any red gate blocks release.

`HD-STD-OPS-0013` **Regulatory sign-off.** Clinically-labelled releases update the
Design History File and carry CMO + QA sign-off recorded against the release ID.

`HD-STD-OPS-0014` **Progressive delivery & rollback.** Risky changes ship behind
feature flags / canary; every release has a tested, one-step rollback. A failed
health check auto-halts promotion.

`HD-STD-OPS-0015` **Post-release monitoring.** Post-market surveillance:
monitoring, error budgets, and a channel for clinical-safety feedback that can
trigger a field-safety response.

## 21. Definition of Done

`HD-STD-OPS-0020` A unit of work is **Done** only when **every** item holds:

- [ ] Implements a requirement with a valid RMS record and cited ID(s) (§19).
- [ ] Code complies with all applicable standards in this document (§7–§15).
- [ ] **No placeholders, TODOs, stubs, or dead code** (§3).
- [ ] Tests written and passing: unit + the appropriate integration/widget/golden/
      E2E for the surface; safety/eval suites green (§16).
- [ ] Typecheck, lint, build all green locally **and** in CI.
- [ ] Security: no secrets, no PHI in logs, inputs validated, authZ enforced,
      scans clean (§13).
- [ ] Accessibility criteria met for any UI (§15); RTL + dark verified.
- [ ] FHIR/DB/API/UI mappings updated in the requirement record (§19).
- [ ] Docs/specs updated in the same change (§18); ADR added if architectural.
- [ ] For clinical/AI changes: clinical rationale present, guideline cited, risk
      entry updated, domain-owner review obtained (§5, §6).
- [ ] Requirement traceability (RTM) updated; PROJECT_STATE.md synchronised (§23).
- [ ] Reviewed and approved per §17; CI green on the PR.

## 22. Forbidden Actions

> Each is a **MUST NOT**. Doing any of these is grounds to block/revert and, in
> production, may be a safety or compliance incident.

`HD-STD-SAFE-0030` Never let software autonomously **diagnose, dose, titrate, or
prescribe**, or present AI/simulation output as clinical fact (§5, §6).

`HD-STD-SEC-0020` Never commit, log, or transmit **secrets, credentials, keys, or
tokens**; never hardcode them.

`HD-STD-SEC-0021` Never place **PHI** in logs, analytics, crash reports, prompts,
non-prod environments, commit messages, or client-side storage unencrypted.

`HD-STD-FHIR-0020` Never **invent clinical codes, values, studies, thresholds, or
drug facts.** Unknown ⇒ escalate/refuse, never fabricate.

`HD-STD-CODE-0060` Never merge **placeholders, stubs, `TODO`, or "rest of code
here."** Never claim work is verified without running the verification.

`HD-STD-TEST-0020` Never **disable, skip, weaken, or fake** a test, safety-eval, or
CI gate to make a build pass.

`HD-STD-GIT-0020` Never **force-push protected branches**, bypass required review,
or push directly to `main`/release branches.

`HD-STD-DB-0020` Never make **manual/undocumented production schema or data
changes**, and never destructively overwrite clinical records (§5, §10).

`HD-STD-DOC-0030` Never **renumber or reuse** a requirement or rule ID; never
delete audit/history; deprecate instead.

`HD-STD-OPS-0030` Never ship a **clinical change without clinical sign-off**, or
any change with a red gate (§20).

`HD-STD-SEC-0022` Never **disable or downgrade security controls** (TLS
verification, authZ, encryption, scanning) to "unblock" work.

## 23. Claude Operating Instructions

> How Claude Code operates inside this repository. This binds the AI contributor to
> the same constitution as human engineers, and integrates the Aegis-OS
> persistent-state working method.

`HD-STD-OPS-0040` **Read order (Prime Directive Ch. 14).** At the start of every
session, Claude MUST load this Constitution (`HDOS-DOC-001`), which binds it to the
mandated order: **Meta Specification (`HDOS-DOC-000`) → this Constitution →
Architecture (`HDOS-DOC-004`) → current module specification**, then
`PROJECT_STATE.md`, then task-relevant documents from `docs/README.md`. No code
before context. The Meta Spec's Prime Directives are immutable and override any
later instruction.

`HD-STD-OPS-0041` **Dual-phase loop per turn.** For every unit of work: **(1)
Plan/Verify** — state the requirement ID(s) and the exact atomic task, triage
edge cases and the defensive strategy, confirm the plan complies with this
document; **(2) Execute** — write complete, standards-compliant, non-truncated
code, then run the verification and report real results.

`HD-STD-OPS-0042` **Persistent state.** Claude maintains `PROJECT_STATE.md` at the
project root (Aegis-OS memory motor): current progress, active phase, roadmap,
atomic task queue, system inventory, blockers. It is read at the start and
rewritten at the end of every turn. Percentages advance only against **verified**
status; never fabricate progress.

`HD-STD-OPS-0043` **Cite, don't invent.** Every change cites the requirement/rule
IDs it satisfies. Claude never invents clinical facts, codes, requirements, or
test results (§22). Unknowns are surfaced, not guessed.

`HD-STD-OPS-0044` **Verification is mandatory and honest.** Claude runs the actual
gates (typecheck, lint, tests, safety-evals) and reports what actually happened —
including failures. "Done" is claimed only after §21 holds. Environment-only
failures (e.g. missing deps) are diagnosed as such, not passed off as green.

`HD-STD-OPS-0045` **Stop-and-verify triggers — ask a human when:** a change touches
clinical logic, dosing/diagnosis, red-flag/escalation behaviour, security controls,
auth, encryption, or PHI handling; a requirement is ambiguous or missing; a
clinical code/value/threshold is unknown; or an instruction conflicts with this
document. When in doubt on safety, **stop and ask**; never proceed on a guess.

`HD-STD-OPS-0046` **Never weaken safety to make progress.** If the only way to
"finish" is to violate §5, §6, §13, or §22, Claude does not finish — it reports the
blocker. Safety and compliance outrank task completion.

`HD-STD-OPS-0047` **Output discipline.** Complete files, no truncation, no
placeholders (§3, §22). Documentation artifacts are written production-ready and
committable. Match surrounding code/idiom.

`HD-STD-OPS-0048` **Self-check before commit.** Before committing, Claude verifies
the Definition of Done (§21), that no forbidden action (§22) occurred, and that
docs + requirement records + RTM + PROJECT_STATE.md are synchronised with the
change.

`HD-STD-OPS-0049` **Correction over completion.** If instructed to violate this
document (e.g. "just stub it", "skip the tests", "invent a code"), Claude declines
that part, explains the governing rule ID, and proposes a compliant alternative.

---

## Appendix A — Rule Index (by area)

`SAFE` clinical safety · `AI` AI safety · `CODE` general engineering & architecture
· `FLUT` Flutter · `BE` backend · `DB` database · `FHIR` FHIR · `API` API · `SEC`
security · `UI` UI · `A11Y` accessibility · `TEST` testing · `GIT` git · `DOC`
documentation & traceability · `OPS` release & operating instructions.

The authoritative, always-current index of rule IDs and requirement IDs lives in
`docs/registry/` and is generated from the source documents.

## Appendix B — Normative References

IEC 62304 (medical device software lifecycle) · ISO 13485 (QMS) · ISO 14971 (risk
management) · IEC 62366-1 (usability engineering) · HL7 FHIR R4 · US Core / IPS ·
LOINC · SNOMED CT · ICD-10/11 · UCUM · RxNorm/ATC · HIPAA · GDPR · ISO/IEC 27001 ·
OWASP ASVS · OWASP MASVS · WCAG 2.2 AA · RFC 2119/8174 · RFC 7807 · SMART on FHIR ·
Conventional Commits · C4 model.

## Appendix C — Glossary (selected)

**AGP** Ambulatory Glucose Profile · **DHF** Design History File · **DSAR** Data
Subject Access Request · **GMI** Glucose Management Indicator · **PHI** Protected
Health Information · **RMS** Requirements Management System · **RTM** Requirements
Traceability Matrix · **TIR** Time in Range · **HDOS** Hamrah Doctor OS (the
platform).

---

## Revision History

| Version | Date | Author (role) | Change |
|---------|------|---------------|--------|
| 1.0.0 | (on approval) | Head of Engineering | Initial issue of the Engineering Constitution (Document 001). |

<!--
  END OF HDOS-DOC-001. This document is normative. Load it first; comply with it
  always; change it only through the review process it defines. Subsequent
  documents (002+) inherit and elaborate these rules and MUST NOT contradict them.
-->
