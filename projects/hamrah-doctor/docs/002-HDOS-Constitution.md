# HD-OS Constitution

> **Document 002 of the HD-OS documentation suite.**
> The constitutional layer of the platform: its **values, patient rights,
> governance bodies, decision rights, and amendment process.** It sits *above* the
> engineering standards (`HDOS-DOC-001` CLAUDE.md) and *under* the project DNA
> (`HDOS-DOC-000` Meta Specification). Where CLAUDE.md says *how to build*, this
> Constitution says *who decides, what is non-negotiable, and how it changes.*
> Read order (Prime Directive): **Meta Spec → this Constitution → Architecture →
> module spec.**

---

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | `HDOS-DOC-002` |
| **Title** | HD-OS Constitution |
| **Type** | Governance / Constitutional Charter |
| **Version** | `1.0.0` |
| **Status** | `DRAFT` (pending ratification per Article X) |
| **Classification** | Internal — Controlled Engineering Document |
| **Owner** | Governance Board (custodian: Head of Engineering) |
| **Ratifying authority** | Chief Medical Officer · Security & Privacy Officer · Head of Engineering · QA Lead (unanimous for Articles I–IV) |
| **Related** | `HDOS-DOC-000` Meta Spec · `HDOS-DOC-001` CLAUDE.md · `HDOS-DOC-004` System-Architecture |
| **Clause ID grammar** | `HD-CONST-ART<Roman>-<NN>` (immutable; never renumbered/reused) |

> ⚕️ **Positioning honesty.** HD-OS is engineered *toward* a regulated,
> clinical-grade posture. No article of this Constitution, by its existence,
> authorises a clinical or medical-device claim; such claims require the gates in
> CLAUDE.md §5/§20 and Meta Spec Ch. 13 to be formally met and recorded in the DHF.

---

## Preamble

We are building HD-OS — the Hamrah Doctor Operating System, an **AI-Native
Clinical Operating System** — as *enterprise medical software*. Our first duty is
to the patient: to do no harm, to protect their data as a fiduciary, and to keep a
qualified human accountable for every clinical decision. This Constitution binds
every contributor — human and AI — to a shared set of non-negotiable values and to
a governance process that makes those values enforceable rather than aspirational.
It is deliberately hard to change (Article X), because the guarantees it makes to
patients and clinicians must be stable.

---

## Article I — Foundational Values (Non-Negotiable)

`HD-CONST-ARTI-01` **Safety over everything.** Patient safety outranks every other
objective — engagement, growth, velocity, cost, elegance. When values tension, the
order in Meta Spec Ch. 2 governs: **Clinical Safety › Security › Privacy ›
Explainability › Interoperability › Testability › Maintainability › Extensibility ›
Scalability › Performance.**

`HD-CONST-ARTI-02` **Truthfulness.** The platform, and everyone building it, tells
the truth. No fabricated clinical facts, codes, thresholds, metrics, test results,
or progress. Unknown means "unknown", never a plausible guess (CLAUDE.md §22; Meta
Spec Ch. 14).

`HD-CONST-ARTI-03` **Human accountability.** A licensed human is accountable for
every clinical decision. Software augments clinicians; it never replaces clinical
judgment on diagnosis, dosing, or prescription (Article III).

`HD-CONST-ARTI-04` **Explainability.** Every clinical or AI-derived recommendation
must be explainable and traceable to guideline-sourced knowledge and to the data it
used (Meta Spec Ch. 10–11).

`HD-CONST-ARTI-05` **Fiduciary data stewardship.** Patient data is held in trust
for the patient's benefit, never treated as an asset to exploit (Article II).

`HD-CONST-ARTI-06` **Traceability.** Nothing ships without a traceable line from
business need → clinical requirement → implementation → test (CLAUDE.md §19).

`HD-CONST-ARTI-07` **Enterprise discipline.** This is enterprise software, not a
prototype. Rigor, review, and verification are the default, not the exception.

---

## Article II — Patient Rights & Data Stewardship

`HD-CONST-ARTII-01` **Right to safety.** Patients have the right to a system that
fails safe, escalates emergencies to humans, and never presents AI/simulation
output as clinical fact.

`HD-CONST-ARTII-02` **Right to privacy & minimisation.** Only the minimum data
necessary is collected and processed, for declared purposes only (CLAUDE.md §13).

`HD-CONST-ARTII-03` **Right to consent & control.** Data leaves the patient's
device or is processed only under explicit, revocable consent. Consent state is
enforced on every access (CLAUDE.md §9, §13).

`HD-CONST-ARTII-04` **Right to portability.** Patients can export their data in an
open standard (FHIR R4) and move it freely (CLAUDE.md §11).

`HD-CONST-ARTII-05` **Right to erasure & access (DSAR).** Access, correction, and
erasure are engineered flows, honoured within legal timelines (GDPR/HIPAA).

`HD-CONST-ARTII-06` **Right to an audit trail.** Every access to and change of a
patient's data is recorded in a tamper-evident log the patient's data governance
can be held to (CLAUDE.md §13).

`HD-CONST-ARTII-07` **Right to equity.** First-class Persian (RTL) localisation and
WCAG 2.2 AA accessibility are rights, not features (CLAUDE.md §14–§15).

`HD-CONST-ARTII-08` **Integrity of the record.** Historical clinical data is never
deleted or destructively overwritten; corrections are additive and superseding
(CLAUDE.md §5, §10; Meta Spec Ch. 14).

---

## Article III — Clinical Safety Charter

`HD-CONST-ARTIII-01` The platform **shall not** autonomously diagnose, dose,
titrate, or prescribe. Such user requests are hard-blocked and redirected to a
clinician (CLAUDE.md §5, §6).

`HD-CONST-ARTIII-02` Red-flag/emergency conditions **shall** trigger a
deterministic escalation to a human, independent of any model (CLAUDE.md §5;
`HD-CLIN-PLAT-000001`).

`HD-CONST-ARTIII-03` Clinical actions **shall** be attributable to, and where
required approved by, a licensed clinician (human-in-the-loop).

`HD-CONST-ARTIII-04` Every clinical feature **shall** carry an ISO 14971 risk
entry with verified risk controls before release (CLAUDE.md §5).

`HD-CONST-ARTIII-05` Medical knowledge **shall** flow only via the governed path
(Guideline → Clinical Review → CKE → Clinical Rules → CDE), never hardcoded into
application code, services, or prompts (Meta Spec Ch. 10).

This charter is normatively elaborated in CLAUDE.md §5 and `HDOS-DOC-005`
(Clinical-Architecture). On any conflict, the stricter (safer) rule governs.

---

## Article IV — AI Governance Charter

`HD-CONST-ARTIV-01` Deterministic safety guardrails **precede and override** any
model; a model is never the last line of defence (CLAUDE.md §6).

`HD-CONST-ARTIV-02` Every AI output reaching a patient **shall** pass validation,
an explainability step, and the clinical review layer (Meta Spec Ch. 11).

`HD-CONST-ARTIV-03` AI **shall not** invent medical logic or guideline thresholds,
leak PHI to models, or take clinical actions (CLAUDE.md §6; Meta Spec Ch. 14).

`HD-CONST-ARTIV-04` Model choice, version, prompts, and knowledge-base versions are
pinned, versioned, evaluated, and recorded per release; changes are reviewed, not
silent (CLAUDE.md §6).

`HD-CONST-ARTIV-05` AI is **transparent, validated, and continuously monitored**;
users are told they are talking to an AI and how to reach a human (Meta Spec
Ch. 15).

---

## Article V — Governance Bodies & Decision Rights

### V.1 Roles

`HD-CONST-ARTV-01` The platform recognises these accountable roles (a person may
hold more than one in early stages, but the *accountabilities* are distinct):

| Role | Owns / is accountable for |
|------|---------------------------|
| **Chief Medical Officer (CMO)** | Clinical safety, clinical content, red-flag/escalation policy, clinical sign-off, ISO 14971 risk file. |
| **Security & Privacy Officer** | Security architecture, PHI protection, threat models, incident response, security/privacy sign-off. |
| **Head of Engineering** | Architecture, engineering standards, ID/registry custody, delivery, ADRs. |
| **QA Lead** | Test strategy, coverage/eval gates, RTM, release-quality sign-off. |
| **Clinical Review Board** | Reviews guideline ingestion → CKE knowledge; approves clinical rules and AI clinical behaviour. |
| **Governance Board** | The above jointly; custodians of this Constitution and its amendment. |

### V.2 Decision authority (who must approve what)

`HD-CONST-ARTV-02` **Decision-rights matrix** — a change may not merge/release
without the required approval(s):

| Change type | Required approver(s) |
|-------------|----------------------|
| Clinical logic, thresholds, red-flag/escalation, clinical content | **CMO** (+ Clinical Review Board for knowledge) |
| AI guardrails, prompts, model/version, eval gates | **CMO + Head of Engineering** |
| Security controls, auth, encryption, PHI handling | **Security & Privacy Officer** |
| Database schema / migrations | **Head of Engineering** (+ Security Officer if PHI columns) |
| Public API contract / versioning | **Head of Engineering** |
| Release (clinically-labelled) | **CMO + Security Officer + QA Lead + Head of Engineering** (Meta Spec Ch. 13) |
| Amendment to this Constitution | per **Article X** |

`HD-CONST-ARTV-03` **Separation of duties.** The author of a safety-critical change
cannot be its sole approver. AI (Claude) is never an approver of clinical, AI, or
security changes — it implements and requests review (CLAUDE.md §23).

---

## Article VI — Engineering Integrity

`HD-CONST-ARTVI-01` **Verification is truth.** "Done" requires the actual gates run
green (CLAUDE.md §21). Claiming unverified work as verified violates Article I.

`HD-CONST-ARTVI-02` **No orphans.** No code without a requirement; no requirement
without acceptance criteria and a verifying test (CLAUDE.md §19).

`HD-CONST-ARTVI-03` **Documentation-as-code.** Behaviour and its documentation
change together, in the same reviewed unit (CLAUDE.md §18).

`HD-CONST-ARTVI-04` **Reversibility.** Changes are small and revertable; every
release has a tested rollback (CLAUDE.md §20; Meta Spec Ch. 13).

---

## Article VII — Interoperability & Openness

`HD-CONST-ARTVII-01` HL7 **FHIR R4** is the canonical clinical data model; standard
terminologies (LOINC/SNOMED/ICD/UCUM/RxNorm) are used and never invented (CLAUDE.md
§11).

`HD-CONST-ARTVII-02` Data is **portable by design**; the patient can take it
elsewhere. Lock-in is contrary to this Constitution.

`HD-CONST-ARTVII-03` Interfaces are **contract-first and versioned**; consumers are
never broken silently (CLAUDE.md §12).

---

## Article VIII — Extensibility & the MDPF

`HD-CONST-ARTVIII-01` The **core is disease-agnostic.** Disease-specific logic
enters only through CKE-encoded, clinically-reviewed knowledge and module
specifications — never the core (Meta Spec Ch. 16).

`HD-CONST-ARTVIII-02` New disease modules **shall** be addable without redesigning
the core (Meta Spec Ch. 15 success criterion). This is the constitutional basis of
the **Medical Digital Platform Framework (MDPF)**.

`HD-CONST-ARTVIII-03` Cross-cutting concerns (identity, consent, audit, security,
FHIR, i18n/RTL, accessibility) are provided **once** by the core and inherited by
all modules.

---

## Article IX — Compliance & Regulatory Commitments

`HD-CONST-ARTIX-01` HD-OS commits to designing toward: **IEC 62304** (software
lifecycle), **ISO 13485** (QMS), **ISO 14971** (risk), **IEC 62366-1** (usability),
**HIPAA**, **GDPR**, applicable local data-protection law, **ISO/IEC 27001**, and
**OWASP ASVS/MASVS** (CLAUDE.md §13, Appendix B).

`HD-CONST-ARTIX-02` A **Design History File (DHF)** is maintained; clinically-
labelled releases update it and carry the sign-offs of Article V.2.

`HD-CONST-ARTIX-03` **Post-market surveillance** and a field-safety response path
exist for any deployed clinical build (CLAUDE.md §20).

---

## Article X — Amendment & Ratification

`HD-CONST-ARTX-01` **Ratification.** This Constitution takes effect when ratified by
the Governance Board. Articles I–IV (values, patient rights, clinical & AI safety)
require **unanimous** ratification.

`HD-CONST-ARTX-02` **Amendment process.** A proposed amendment is a reviewed PR that
(a) states the clause ID(s) affected, (b) gives a safety/impact rationale, (c)
obtains the approvals in Article V.2 for its domain, and (d) for Articles I–IV,
unanimous Governance Board approval.

`HD-CONST-ARTX-03` **Versioning & immutability.** Amendments bump this document's
SemVer and append to its revision history. Clause IDs are **immutable**: a withdrawn
clause is marked `DEPRECATED` (kept, never deleted or renumbered) with its
superseding clause referenced (CLAUDE.md §22; Meta Spec Ch. 14).

`HD-CONST-ARTX-04` **No emergency bypass of safety.** Time pressure, incidents, or
deadlines never justify suspending Articles I–IV. Emergencies are handled *within*
the safety rules, not by waiving them.

---

## Article XI — Precedence & Conflict Resolution

`HD-CONST-ARTXI-01` Precedence, highest first (mirrors CLAUDE.md §0.3):
**law/regulation › patient safety › this Constitution & Meta Spec › CLAUDE.md &
architecture › feature specs & requirements › team conventions.**

`HD-CONST-ARTXI-02` On any conflict between documents, the **safety-higher** rule
wins and the lower document is corrected. Conflicts are defects, not choices.

---

## Article XII — Enforcement

`HD-CONST-ARTXII-01` A violation of a **MUST/shall-not** clause blocks merge and, in
production, is an incident triaged by severity (safety/security violations are
Sev-1).

`HD-CONST-ARTXII-02` **Claude (AI contributor) enforcement.** If instructed to
violate this Constitution, Claude declines the offending part, cites the clause ID,
and proposes a compliant alternative (CLAUDE.md §23 `HD-STD-OPS-0049`). Safety and
compliance outrank task completion.

`HD-CONST-ARTXII-03` **Human enforcement.** Reviewers are responsible for checking
constitutional compliance; approving a violating change is itself a governance
lapse.

---

## Ratification Block

| Role | Name | Decision | Date |
|------|------|----------|------|
| Chief Medical Officer | _pending_ | _pending_ | — |
| Security & Privacy Officer | _pending_ | _pending_ | — |
| Head of Engineering | _pending_ | _pending_ | — |
| QA Lead | _pending_ | _pending_ | — |

_This Constitution is `DRAFT` until the block above is complete (Article X.1)._

---

## Revision History

| Version | Date | Author (role) | Change |
|---------|------|---------------|--------|
| 1.0.0 | (on ratification) | Governance Board | Initial issue: values, patient rights, clinical & AI charters, governance & decision rights, integrity, interoperability, extensibility/MDPF, compliance, amendment, precedence, enforcement. |

<!-- END OF HDOS-DOC-002. Constitutional layer. Amend only via Article X. -->
