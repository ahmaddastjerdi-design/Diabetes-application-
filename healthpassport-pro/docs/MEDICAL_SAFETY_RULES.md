# HealthPassport Pro — Medical Safety Rules

Status: Phase 0 · Owner: Clinical Safety Officer (physician sign-off required)

Software touching chronic-disease care can harm through wrong information, false
reassurance, missed red flags, or scope creep into diagnosis/treatment. This
document is **binding on the code**.

> Regulatory framing: HealthPassport Pro is positioned as a **personal health
> record and educational chronic-care guide**, deliberately outside the
> definition of a diagnostic/therapeutic medical device. The boundaries below are
> what keep it there. Any feature that would cross a boundary requires a
> documented regulatory assessment (FDA SaMD / EU MDR) **before** implementation.

---

## 1. Non-negotiable boundaries

The app **must not**:
1. **Diagnose** — assert the patient has/does not have a disease.
2. **Prescribe or change therapy** — tell a patient to start/stop/adjust a
   medication or dose. (It may *record* what a clinician prescribed and *remind*.)
3. **Give individualized treatment directives** framed as medical advice.
4. **Reassure away red flags.** Emergency-pattern inputs always escalate.
5. **Present simplified analytics as clinical truth** about the individual.

The app **may**: track data; show readings vs. **cited reference ranges** and
clinician-set targets (clearly labeled as reference, not verdict); provide
**reviewed, evidence-based education**; help prepare questions and a report; and
**escalate** red flags to "contact your doctor" or "seek emergency care."

## 2. Global disclaimer (verbatim)

Shown at onboarding (with recorded acknowledgment), persistently in the app
footer, and on the doctor report:

> HealthPassport Pro is a personal health record and educational chronic care
> guide. It does not diagnose, prescribe, or replace your physician. For urgent
> symptoms such as chest pain, severe shortness of breath, fainting, stroke-like
> symptoms, or severe weakness, seek emergency medical care.

## 3. The red-flag rules engine (`lib/medical-rules`)

Every interpretive surface (vital entry, lab entry, symptom entry, daily
check-in, report) passes through one engine returning a **disposition**:

| Disposition | Meaning | UI behavior |
|-------------|---------|-------------|
| `EMERGENCY` | Red-flag pattern | Prominent, acknowledge-required "seek emergency care" banner; suppress reassuring copy |
| `URGENT` | Concerning, not immediately life-threatening | Clear "contact your care team promptly" |
| `ROUTINE` | Within expected ranges / general education | Normal display + standing disclaimer |

The engine is **data-driven and testable**: thresholds live in reviewed tables,
each with a citation and reviewer field. Unit tests assert that known red-flag
inputs escalate and that no path renders interpretive guidance without a
disposition. Values are evaluated in **canonical units** (inputs are converted
first).

### 3.1 Symptom red flags → EMERGENCY (illustrative; CSO sign-off required)
Chest pain/pressure; face-droop / arm-weakness / slurred speech (stroke FAST);
severe shortness of breath; fainting / loss of consciousness; severe weakness;
sudden severe headache. Any of these → `EMERGENCY` regardless of numbers, with
the global emergency guidance.

### 3.2 Vital / lab thresholds (illustrative)
- Blood glucose **< 54 mg/dL (3.0 mmol/L)** → `EMERGENCY` (severe hypoglycemia);
  **54–69** → `URGENT`; **≥ 400** → `EMERGENCY`; **> 250 persistent** → `URGENT`.
- Blood pressure **≥ 180/120 mmHg** → `URGENT` (→ `EMERGENCY` if symptomatic);
  very low systolic → `URGENT` if symptomatic.
- Heart rate **< 40** or **≥ 150** resting → `URGENT`.
- Temperature **≥ 41 °C** → `EMERGENCY`; **< 35 °C** → `URGENT`.
- SpO₂ **< 92%** → `URGENT` (→ `EMERGENCY` with breathlessness).
- Potassium and eGFR extremes (CKD context) → `URGENT` with "contact your doctor."

> These illustrate the mechanism. **Shipping thresholds are owned by the Clinical
> Safety Officer**, versioned, and cited in `lib/medical-rules`.

## 4. Reference ranges vs. personal targets

- **Reference ranges** are population-level, sourced from guidelines (ADA,
  ACC/AHA, KDIGO, NICE) and cited in code. Shown for context only.
- **Personal targets** (clinician-set, when captured) take visual precedence and
  are labeled "your clinician's target," never overridden by a generic range.
- Copy pattern: *"This reading is above the general reference range / your
  target. Ranges are guidance, not a diagnosis — discuss with your care team."*

## 5. Chronic-care guidance governance

- Guide content (`content/guides/*`) is **evidence-based**, written at an
  accessible reading level, and carries **source, reviewer, and last-reviewed
  date**. Only `approved` items render in production.
- No content instructs medication changes; medication content is limited to
  general mechanism / adherence / side-effect awareness with "talk to your
  clinician/pharmacist" framing.
- Workflow: draft → clinician review → approved (dated). Unreviewed content is
  hidden in production.

## 6. Change control for safety-relevant code

- Files under `lib/medical-rules/`, reference-range tables, and guide content are
  **safety-relevant**. Changes require Clinical Safety Officer review + a second
  engineer review, are versioned with rationale + citation, and their tests must
  pass in CI (a failing safety test blocks release).

## 7. Known simplifications (must be stated where they surface)

- Derived indicators (e.g. estimated HbA1c from average glucose, CKD-risk
  prompts) are **simplified**, labeled as such, never a substitute for a lab or a
  clinician's assessment.
- The app cannot see the whole clinical picture; its outputs are inputs to a
  conversation with a clinician, by design.
