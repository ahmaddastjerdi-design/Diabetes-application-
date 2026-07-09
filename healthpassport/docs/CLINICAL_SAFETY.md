# HealthPassport Pro — Clinical Safety

Status: living document · Owner: Clinical Safety Officer (physician sign-off required)

Software that touches chronic-disease care can cause harm through **wrong
information**, **false reassurance**, **missed red flags**, or **scope creep
into diagnosis/treatment**. This document defines how the product is safe by
design, and it is binding on the code.

> Regulatory framing: HealthPassport Pro is positioned as a **personal health
> record and health-education tool**, deliberately kept outside the definition
> of a diagnostic/therapeutic medical device. The boundaries below are what keep
> it there. Any feature that would cross a boundary requires a documented
> regulatory assessment (e.g. FDA SaMD / EU MDR) *before* implementation.

---

## 1. Non-negotiable boundaries

The app **must not**:
1. **Diagnose** — assert that the patient has, or does not have, a disease.
2. **Prescribe or dose** — tell a patient to start/stop/change a medication or
   its dose. (It may *record* what a clinician prescribed, and *remind*.)
3. **Give individualized treatment directives** presented as medical advice.
4. **Reassure away red-flag symptoms.** Emergency-pattern inputs always escalate.
5. **Present its simplified analytics as clinical truth** about the individual.

The app **may**:
- Record and organize the patient's own data.
- Show the patient's readings against **standard, cited reference ranges** and
  the **targets their clinician set**, clearly labeled as reference, not verdict.
- Provide **general, evidence-based education** with sources and a clinician
  review trail.
- Help the patient **prepare questions and a report** for their clinician.
- **Escalate**: recognize red-flag patterns and direct the patient to seek
  appropriate care.

---

## 2. The safety engine (`src/safety`)

Every surface that interprets data or presents guidance passes through a single
safety engine. It returns one of three dispositions, and the UI must honor it:

| Disposition | Meaning | UI behavior |
|-------------|---------|-------------|
| `EMERGENCY` | Input matches a red-flag pattern | Prominent, non-dismissible-until-acknowledged "seek emergency care" banner; suppress any reassuring copy |
| `URGENT` | Concerning but not immediately life-threatening | Clear "contact your care team promptly" guidance |
| `ROUTINE` | Within expected ranges / general education | Normal display, always with the standing disclaimer and, for education, sources |

The engine is **data-driven and testable**: red-flag thresholds and rules live
in reviewed tables (`safety/rules/*`), each with a citation and a
clinician-review field. Unit tests assert that known red-flag inputs escalate
and that no code path can render interpretive guidance without a disposition.

### Example red-flag rules (illustrative; final values require clinician sign-off)
- Blood glucose **< 54 mg/dL (3.0 mmol/L)** → `EMERGENCY` (severe hypoglycemia).
- Blood glucose **> 300 mg/dL** with symptoms, or any reading with
  DKA-pattern symptoms → `EMERGENCY`/`URGENT`.
- Blood pressure **≥ 180/120 mmHg** → `URGENT`→`EMERGENCY` if symptomatic
  (hypertensive crisis pattern).
- Chest pain, one-sided weakness, difficulty speaking, severe breathlessness →
  `EMERGENCY` regardless of numbers.

> These illustrate the mechanism. The shipping thresholds are owned by the
> Clinical Safety Officer, versioned, and cited in `safety/rules/`.

---

## 3. Reference ranges vs. personal targets

- **Reference ranges** are population-level, sourced from guidelines
  (e.g. ADA Standards of Care, ACC/AHA, NICE) and cited in the code.
- **Personal targets** are what the patient's clinician set (e.g. an individual
  HbA1c or BP goal). When present, targets take visual precedence and the UI
  says "your clinician's target," never overriding it with a generic range.
- Neither is ever phrased as a diagnosis. Copy pattern: *"This reading is above
  the general reference range / your target. Ranges are guidance, not a
  diagnosis — discuss with your care team."*

---

## 4. Educational content governance

- Every educational item carries: a **source/citation**, a **last-reviewed
  date**, and a **reviewer** field.
- Content is **evidence-based** and written at an accessible reading level.
- No content instructs medication changes. Content about medications is limited
  to general mechanism/adherence/side-effect awareness with "talk to your
  clinician/pharmacist" framing.
- A lightweight **content-review workflow** gates publishing: draft → clinician
  review → approved (with date). Unreviewed content is not shown in production.

---

## 5. Standing disclaimers & consent

- A persistent, unobtrusive disclaimer states the app is an educational PHR, not
  medical advice or a diagnostic device.
- First-run onboarding presents the scope and limits and records the patient's
  acknowledgment.
- Emergency guidance always includes local-emergency-number framing appropriate
  to the patient's locale (configurable; defaults surfaced by region).

---

## 6. Change control for safety-relevant code

- Files under `src/safety/` and any reference-range/threshold table are
  **safety-relevant**. Changes require Clinical Safety Officer review and a
  second engineer review.
- Each rule change is versioned with a rationale and citation.
- Safety-engine tests are **required to pass** in CI; a failing safety test
  blocks release.

---

## 7. Known simplifications (must be stated to users where they surface)

- Any trend/estimate (e.g. estimated HbA1c from average glucose) is a
  **simplified derived indicator**, labeled as such, never a substitute for a
  lab result.
- The app cannot see the whole clinical picture; its outputs are inputs to a
  conversation with a clinician, by design.
