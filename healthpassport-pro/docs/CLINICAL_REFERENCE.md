# HealthPassport Pro — Clinical Reference Dataset

> ⚠️ **DRAFT — NOT YET CLINICALLY APPROVED**
>
> This document is **DRAFT reference data pending sign-off by the Clinical Safety
> Officer (a licensed physician)**. Every value below must be reviewed, dated, and
> initialed by the CSO before it is allowed to drive any user-facing surface or
> the `lib/medical-rules` engine.
>
> **HealthPassport Pro never diagnoses, prescribes, or replaces a clinician.** The
> values here are **population-level reference ranges and red-flag thresholds**
> shown for context and escalation only. They are **not** individualized medical
> advice and **not** a verdict about any person. Clinician-set personal targets,
> when present, always take precedence (see `docs/MEDICAL_SAFETY_RULES.md §4`).
>
> Guidelines are periodically revised. Verify against the current edition before
> each release. Where major guideline bodies disagree, **both** are recorded and
> the app must present the more **conservative** disposition.

---

## 0. How to read this document (for engineers)

Each domain gives category tables suitable for translation into typed reference
tables. Columns follow a consistent shape:

- **Measurement** — canonical name.
- **Unit(s)** — conventional unit first, **SI** second where clinically used.
  Store and evaluate in **canonical units** (convert inputs first).
- **Category / boundaries** — inclusive/exclusive boundaries as written by the
  source guideline. Reproduce boundaries exactly; do not "round."
- **Disposition** — one of `ROUTINE`, `URGENT`, `EMERGENCY` (per
  `MEDICAL_SAFETY_RULES §3`) where a red-flag mapping applies. Categories that are
  purely descriptive (not red flags) are marked `—`.
- **Citation** — named guideline body + specific source.

**Unit conversion factors used below**

| Analyte | Conventional → SI |
|---|---|
| Glucose | mg/dL × 0.0555 = mmol/L |
| Total/LDL/HDL cholesterol | mg/dL × 0.02586 = mmol/L |
| Triglycerides | mg/dL × 0.01129 = mmol/L |
| Potassium | mEq/L = mmol/L (1:1) |
| HbA1c | % (NGSP) → mmol/mol (IFCC): (%−2.15)×10.929 |

**Disposition philosophy.** Dispositions here are the app's *escalation* mapping,
not clinical staging. They are intentionally conservative and symptom-aware: a
number that is merely "high" by category is not automatically an EMERGENCY. Final
disposition logic is owned by the CSO in `lib/medical-rules`.

---

## 1. Hypertension (Blood Pressure)

**Primary source:** 2017 ACC/AHA Guideline for the Prevention, Detection,
Evaluation, and Management of High Blood Pressure in Adults (Whelton PK et al.,
*Hypertension* / *J Am Coll Cardiol* 2018). **Divergence source:** 2023 ESH
Guidelines for the Management of Arterial Hypertension (*J Hypertens* 2023) and
2024 ESC Guidelines (*Eur Heart J* 2024).

Categories require **≥2 readings on ≥2 occasions**, seated, properly measured. The
category is set by the **higher** of systolic or diastolic. Units: **mmHg** (no SI
conversion).

### 1.1 ACC/AHA 2017 office BP categories

| Category | Systolic (mmHg) | | Diastolic (mmHg) | Disposition | Citation |
|---|---|---|---|---|---|
| Normal | <120 | and | <80 | ROUTINE | ACC/AHA 2017 |
| Elevated | 120–129 | and | <80 | ROUTINE | ACC/AHA 2017 |
| Stage 1 hypertension | 130–139 | or | 80–89 | ROUTINE (educational; "discuss with care team") | ACC/AHA 2017 |
| Stage 2 hypertension | ≥140 | or | ≥90 | ROUTINE→URGENT per CSO (persistent/very high) | ACC/AHA 2017 |
| Hypertensive crisis | >180 | and/or | >120 | URGENT; **EMERGENCY if symptomatic** (see §1.3) | ACC/AHA 2017 |

### 1.2 ESC/ESH divergence (record both)

ACC/AHA calls 130–139/80–89 "Stage 1 hypertension." **European guidelines do
not** — they keep the diagnostic threshold at **≥140/90**:

| Category (2023 ESH) | Systolic | | Diastolic |
|---|---|---|---|
| Optimal | <120 | and | <80 |
| Normal | 120–129 | and | 80–84 |
| High-normal | 130–139 | and/or | 85–89 |
| Grade 1 HTN | 140–159 | and/or | 90–99 |
| Grade 2 HTN | 160–179 | and/or | 100–109 |
| Grade 3 HTN | ≥180 | and/or | ≥110 |

> Source: 2023 ESH Guidelines (*J Hypertens* 2023;41:1874–2071). The 2024 ESC
> guideline additionally introduces an "Elevated BP" band (120–139/70–89) with a
> new lower general target of <130/80 for many treated adults. **App copy must not
> tell a user in the 130–139/80–89 band that they "have hypertension"** — the two
> bodies disagree. Present as "above the ACC/AHA reference range; European
> guidelines classify this as high-normal — discuss with your care team."

### 1.3 Hypertensive crisis: URGENT vs EMERGENCY

BP **≥180/120 mmHg** is the crisis threshold. Clinically split into:

- **Hypertensive urgency** — ≥180/120 **without** signs of acute target-organ
  damage → **URGENT** ("contact your care team promptly / seek same-day care").
- **Hypertensive emergency** — ≥180/120 **with** acute symptoms (chest pain,
  shortness of breath, neurological deficit/stroke signs, severe headache, visual
  change, back pain) → **EMERGENCY** ("seek emergency care now").

> Source: ACC/AHA 2017 (hypertensive crisis defined at >180 and/or >120 mmHg;
> emergency = crisis + target-organ damage). The app cannot assess target-organ
> damage, so it escalates ≥180/120 to **URGENT** by default and to **EMERGENCY**
> whenever any co-reported red-flag symptom is present (§6).

---

## 2. Type 2 Diabetes (Glycemia)

**Primary source:** American Diabetes Association, *Standards of Care in
Diabetes* — Section 2 (Diagnosis) and Section 6 (Glycemic Goals, Hypoglycemia,
and Hyperglycemic Crises), *Diabetes Care* Supplement (2025 & 2026 editions;
Section 6 of the 2025 edition = PubMed PMID 39651981). **Hyperglycemic-crisis
source:** ADA/EASD/AACE/JBDS/DTN-UK Consensus Report, *Hyperglycemic Crises in
Adults With Diabetes*, *Diabetes Care* 2024;47:1257 (and 2024 Diabetologia
consensus).

Glucose units: **mg/dL** (conventional) and **mmol/L** (SI). HbA1c: **%** (NGSP)
and **mmol/mol** (IFCC).

### 2.1 Diagnostic reference points (ADA) — for context/education only

The app does **not** diagnose; these are reference anchors so a user understands
where a lab value falls.

| Test | Normal | Prediabetes | Diabetes (diagnostic) | Citation |
|---|---|---|---|---|
| Fasting plasma glucose | <100 mg/dL (<5.6 mmol/L) | 100–125 mg/dL (5.6–6.9 mmol/L) — impaired fasting glucose | ≥126 mg/dL (≥7.0 mmol/L) | ADA Std of Care §2 |
| 2-h plasma glucose (75-g OGTT) | <140 mg/dL (<7.8 mmol/L) | 140–199 mg/dL (7.8–11.0 mmol/L) — impaired glucose tolerance | ≥200 mg/dL (≥11.1 mmol/L) | ADA Std of Care §2 |
| Random plasma glucose | — | — | ≥200 mg/dL (≥11.1 mmol/L) **with** classic symptoms | ADA Std of Care §2 |
| HbA1c | <5.7% (<39 mmol/mol) | 5.7–6.4% (39–46 mmol/mol) | ≥6.5% (≥48 mmol/mol) | ADA Std of Care §2 |

> Note: A diabetes diagnosis requires **two abnormal results** (either two
> different tests, or the same test repeated) unless there is unequivocal
> hyperglycemia with classic symptoms. The app never asserts the diagnosis.

### 2.2 ADA glycemic targets for most non-pregnant adults

| Target | Value | SI | Citation |
|---|---|---|---|
| HbA1c (common adult goal) | <7% | <53 mmol/mol | ADA Std of Care §6 |
| Preprandial (pre-meal) capillary glucose | 80–130 mg/dL | 4.4–7.2 mmol/L | ADA Std of Care §6 |
| Peak postprandial (1–2 h after meal start) | <180 mg/dL | <10.0 mmol/L | ADA Std of Care §6 |

> Targets are **individualized**: a stricter HbA1c (e.g. <6.5%) may suit some;
> a looser goal (e.g. <8%) suits those with limited life expectancy, severe
> hypoglycemia history, or extensive comorbidity. The app must defer to the
> clinician-set personal target when one exists.

### 2.3 Hypoglycemia (ADA levels)

| Level | Glucose | SI | Disposition | Citation |
|---|---|---|---|---|
| Level 1 (alert value) | 54–69 mg/dL | 3.0–3.8 mmol/L | URGENT ("treat now with fast carbs; contact care team if recurrent") | ADA Std of Care §6 |
| Level 2 (clinically significant) | <54 mg/dL | <3.0 mmol/L | **EMERGENCY** (severe/neuroglycopenic risk) | ADA Std of Care §6 |
| Level 3 (severe) | Any low glucose with **altered mental/physical status requiring assistance** | — | **EMERGENCY** | ADA Std of Care §6 |

> `<54 mg/dL (<3.0 mmol/L)` is the specified severe-hypoglycemia red-flag
> threshold. Level 3 is defined by **impairment**, not a specific number.

### 2.4 Hyperglycemia red flags

| Condition | Threshold | SI | Disposition | Citation |
|---|---|---|---|---|
| Marked hyperglycemia (context flag) | >250 mg/dL persistent | >13.9 mmol/L | URGENT ("contact care team; check for ketones if type 1 / prone") | ADA/consensus |
| Severe hyperglycemia | ≥400 mg/dL | ≥22.2 mmol/L | **EMERGENCY** | ADA/consensus (conservative app threshold) |
| DKA glucose criterion | ≥200 mg/dL **plus** ketosis + acidosis | ≥11.1 mmol/L | **EMERGENCY** (see DKA pattern §6) | ADA Hyperglycemic Crises Consensus 2024 |

> DKA is a **pattern**, not a single number: hyperglycemia (≥200 mg/dL, or known
> diabetes irrespective of glucose) **+** ketonemia (β-hydroxybutyrate ≥3.0 mmol/L
> or urine ketones ≥2+) **+** metabolic acidosis (pH <7.3 and/or bicarbonate
> <18 mmol/L). Source: 2024 Hyperglycemic Crises consensus (*Diabetes Care*
> 2024;47:1257). The app cannot measure pH/bicarbonate; it escalates the
> **symptom pattern** (§6), not lab confirmation.

---

## 3. Chronic Kidney Disease (CKD)

**Primary source:** KDIGO 2024 Clinical Practice Guideline for the Evaluation and
Management of Chronic Kidney Disease (*Kidney International* 2024;105(4S):S117–S314).
Potassium/hyperkalemia dispositions cross-referenced to European Resuscitation
Council guidance and standard clinical references.

### 3.1 GFR categories (KDIGO G1–G5)

Unit: **mL/min/1.73 m²**.

| Category | eGFR | Description | Disposition | Citation |
|---|---|---|---|---|
| G1 | ≥90 | Normal or high | ROUTINE (CKD only if other kidney-damage marker present) | KDIGO 2024 |
| G2 | 60–89 | Mildly decreased | ROUTINE (as above) | KDIGO 2024 |
| G3a | 45–59 | Mildly–moderately decreased | ROUTINE ("discuss with care team") | KDIGO 2024 |
| G3b | 30–44 | Moderately–severely decreased | URGENT-leaning (context; clinician follow-up) | KDIGO 2024 |
| G4 | 15–29 | Severely decreased | URGENT ("contact your care team") | KDIGO 2024 |
| G5 | <15 | Kidney failure | URGENT ("contact your care team promptly") | KDIGO 2024 |

> G1/G2 alone do **not** meet CKD criteria without a marker of kidney damage
> (e.g. albuminuria, structural). The app must not label a G1/G2 eGFR as "kidney
> disease." Dispositions above reflect information-escalation urgency, not acute
> emergency; a low eGFR by itself is rarely an ED-level emergency.

### 3.2 Albuminuria categories (KDIGO A1–A3) — UACR

Measurement: **Urine albumin-to-creatinine ratio (UACR)**. Units: **mg/g**
(conventional) and **mg/mmol** (SI).

| Category | UACR (mg/g) | UACR (mg/mmol) | Description | Disposition | Citation |
|---|---|---|---|---|---|
| A1 | <30 | <3 | Normal to mildly increased | ROUTINE | KDIGO 2024 |
| A2 | 30–300 | 3–30 | Moderately increased | ROUTINE ("discuss with care team") | KDIGO 2024 |
| A3 | >300 | >30 | Severely increased | URGENT-leaning (clinician follow-up) | KDIGO 2024 |

> CKD is staged as **CGA**: Cause + GFR category (G) + Albuminuria category (A).
> Risk is a 2-D heat map (KDIGO risk grid), not GFR alone.

### 3.3 Potassium — hyperkalemia red flags

Measurement: **Serum potassium**. Units: **mmol/L** (= mEq/L). Normal reference
≈ **3.5–5.0 mmol/L** (lab-dependent).

| Band | Potassium | Disposition | Citation |
|---|---|---|---|
| Mild hyperkalemia | 5.5–5.9 mmol/L | URGENT ("contact your care team") | ERC / standard clinical refs |
| Moderate hyperkalemia | 6.0–6.4 mmol/L | URGENT→EMERGENCY per CSO | ERC / standard clinical refs |
| Severe hyperkalemia | ≥6.5 mmol/L | **EMERGENCY** (arrhythmia risk; ECG monitoring indicated) | ERC / standard clinical refs |
| Hypokalemia (context) | <3.5 mmol/L | URGENT if symptomatic; <2.5 → EMERGENCY | standard clinical refs |

> Classification bands vary between references (e.g. some use severe >7.0). The
> app adopts the **conservative** European Resuscitation Council split
> (mild 5.5–5.9 / moderate 6.0–6.4 / severe ≥6.5) and treats **≥6.5 mmol/L, or
> any hyperkalemia with symptoms, as EMERGENCY**. Home users rarely have
> real-time potassium; this primarily flags returned lab values.

---

## 4. Dyslipidemia / Cardiovascular Risk (Lipids)

**Primary source:** 2018 AHA/ACC/Multisociety Guideline on the Management of Blood
Cholesterol (Grundy SM et al., *Circulation* 2019;139:e1082). Category cut-points
below follow the long-standing NCEP ATP III lipid strata that the ACC/AHA
framework continues to reference for lipid interpretation. Units: **mg/dL**
(conventional) and **mmol/L** (SI).

> Modern ACC/AHA practice is **risk-based** (10-year ASCVD risk + LDL-lowering
> intensity), **not** a single "normal LDL" cutoff. These strata are for
> **educational context** on where a value falls, not treatment decisions.

### 4.1 LDL cholesterol

| Category | mg/dL | mmol/L | Disposition | Citation |
|---|---|---|---|---|
| Optimal | <100 | <2.6 | ROUTINE | NCEP ATP III / ACC-AHA |
| Near/above optimal | 100–129 | 2.6–3.3 | ROUTINE | NCEP ATP III / ACC-AHA |
| Borderline high | 130–159 | 3.4–4.1 | ROUTINE ("discuss with care team") | NCEP ATP III / ACC-AHA |
| High | 160–189 | 4.1–4.9 | ROUTINE ("discuss with care team") | NCEP ATP III / ACC-AHA |
| Very high | ≥190 | ≥4.9 | URGENT-leaning (possible familial hypercholesterolemia; clinician review) | 2018 ACC/AHA (LDL ≥190 flag) |

### 4.2 HDL cholesterol

| Category | mg/dL | mmol/L | Disposition | Citation |
|---|---|---|---|---|
| Low (risk factor) | <40 (men) / <50 (women) | <1.0 / <1.3 | ROUTINE | NCEP ATP III / harmonized MetS |
| Acceptable | 40–59 | 1.0–1.5 | ROUTINE | NCEP ATP III |
| High (protective) | ≥60 | ≥1.6 | ROUTINE | NCEP ATP III |

### 4.3 Triglycerides

| Category | mg/dL | mmol/L | Disposition | Citation |
|---|---|---|---|---|
| Normal | <150 | <1.7 | ROUTINE | NCEP ATP III / ACC-AHA |
| Borderline high | 150–199 | 1.7–2.2 | ROUTINE | NCEP ATP III / ACC-AHA |
| High | 200–499 | 2.3–5.6 | ROUTINE ("discuss with care team") | NCEP ATP III / ACC-AHA |
| Very high | ≥500 | ≥5.6 | URGENT-leaning (pancreatitis risk; clinician review) | 2018 ACC/AHA |

### 4.4 Total cholesterol

| Category | mg/dL | mmol/L | Disposition | Citation |
|---|---|---|---|---|
| Desirable | <200 | <5.2 | ROUTINE | NCEP ATP III |
| Borderline high | 200–239 | 5.2–6.2 | ROUTINE | NCEP ATP III |
| High | ≥240 | ≥6.2 | ROUTINE ("discuss with care team") | NCEP ATP III |

---

## 5. Obesity / Metabolic Syndrome

### 5.1 BMI categories (WHO)

**Source:** WHO adult BMI classification. Measurement: **BMI = kg/m²**.

| Category | BMI (kg/m²) | Disposition | Citation |
|---|---|---|---|
| Underweight | <18.5 | ROUTINE | WHO |
| Normal weight | 18.5–24.9 | ROUTINE | WHO |
| Overweight (pre-obese) | 25.0–29.9 | ROUTINE | WHO |
| Obesity class I | 30.0–34.9 | ROUTINE | WHO |
| Obesity class II | 35.0–39.9 | ROUTINE | WHO |
| Obesity class III (severe/extreme) | ≥40.0 | ROUTINE | WHO |

> BMI is a screening proxy, not a body-composition measure, and its risk
> thresholds differ by ancestry (WHO notes lower Asian action points, e.g.
> overweight ≥23, obese ≥27.5). Present BMI as context, never as a health verdict.

### 5.2 Waist circumference — central-obesity risk

**Sources:** WHO and NCEP ATP III. Measurement: **waist circumference (cm)**.

| Threshold set | Men | Women | Meaning | Citation |
|---|---|---|---|---|
| WHO "increased risk" | ≥94 cm | ≥80 cm | Increased cardiometabolic risk | WHO |
| WHO / ATP III "substantially increased" | ≥102 cm | ≥88 cm | Substantially increased risk; ATP III MetS cutoff | NCEP ATP III |

> Disposition: ROUTINE (educational). Population-specific cut points apply
> (harmonized MetS criteria defer to region-specific values, e.g. IDF thresholds
> of ≥90 cm men / ≥80 cm women for many Asian populations).

### 5.3 Metabolic syndrome criteria (Harmonized 2009 / NCEP ATP III)

**Source:** Harmonizing the Metabolic Syndrome — Joint Interim Statement (IDF,
NHLBI, AHA, WHF, IAS, IASO), *Circulation* 2009;120:1640. Diagnosis = **any 3 of
the following 5** (no single obligatory component):

| # | Component | Threshold | SI | Citation |
|---|---|---|---|---|
| 1 | Elevated waist circumference | Population-specific (e.g. ATP III ≥102 cm men / ≥88 cm women) | — | Harmonized 2009 |
| 2 | Elevated triglycerides | ≥150 mg/dL (or on drug treatment) | ≥1.7 mmol/L | Harmonized 2009 |
| 3 | Reduced HDL cholesterol | <40 mg/dL men / <50 mg/dL women (or on treatment) | <1.0 / <1.3 mmol/L | Harmonized 2009 |
| 4 | Elevated blood pressure | Systolic ≥130 and/or diastolic ≥85 mmHg (or on antihypertensive) | — | Harmonized 2009 |
| 5 | Elevated fasting glucose | ≥100 mg/dL (or on glucose-lowering treatment) | ≥5.6 mmol/L | Harmonized 2009 |

> Disposition: ROUTINE (educational). Meeting ≥3 → "you may meet criteria for
> metabolic syndrome — a cluster your clinician should review." The app describes
> the cluster; it does not diagnose it.

---

## 6. Acute Red-Flag Vitals & Symptoms (Escalation Triggers)

This section drives the `EMERGENCY` / `URGENT` escalation paths in
`lib/medical-rules`. It is intentionally **conservative and symptom-aware**.
The app cannot examine a patient; when a value and a red-flag symptom co-occur,
escalate to the **higher** disposition.

### 6.1 Vital-sign thresholds

| Measurement | Unit | URGENT band | EMERGENCY band | Citation |
|---|---|---|---|---|
| Systolic/diastolic BP | mmHg | ≥180/120 (no acute symptoms) | ≥180/120 **with** acute symptoms | ACC/AHA 2017 |
| Blood glucose (low) | mg/dL (mmol/L) | 54–69 (3.0–3.8) | <54 (<3.0), or any low with impairment | ADA Std of Care §6 |
| Blood glucose (high) | mg/dL (mmol/L) | >250 persistent (>13.9) | ≥400 (≥22.2), or DKA/HHS pattern | ADA / Hyperglycemic Crises 2024 |
| SpO₂ (oxygen saturation) | % | <92% at rest | <92% **with** breathlessness/chest pain, or <90% | NEWS2 (RCP); WHO hypoxemia <90% |
| Temperature (high) | °C (°F) | ≥38.0 (100.4) with concern; ≥39.1 flag | ≥41.0 (105.8) hyperpyrexia | NEWS2 (RCP); clinical refs |
| Temperature (low) | °C (°F) | ≤35.0 (95.0) hypothermia | <32.0 (89.6) moderate–severe hypothermia | NEWS2 (RCP); clinical refs |
| Heart rate (resting) | bpm | ≤40 or ≥131 | Extreme HR **with** syncope/chest pain/dyspnea | NEWS2 (RCP) |
| Respiratory rate | breaths/min | ≤8 or ≥25 | Severe distress with RR extreme + low SpO₂ | NEWS2 (RCP) |

> **SpO₂:** NEWS2 scores ≤91% at the maximum (score 3) level; WHO defines
> hypoxemia as SpO₂ <90%. The app uses **<92%** as the URGENT trigger (matching
> `MEDICAL_SAFETY_RULES §3.2`) and escalates to EMERGENCY with breathlessness or
> at <90%. Note pulse-oximeter accuracy limits, especially on darker skin tones —
> never use SpO₂ to *reassure away* breathlessness.
>
> **Temperature:** single-number thresholds are context-dependent (age,
> immunosuppression, neutropenia). ≥41 °C (hyperpyrexia) and ≤32 °C (moderate
> hypothermia) are the hard EMERGENCY anchors; milder fever/hypothermia is URGENT
> only with accompanying red-flag features.
>
> **Heart rate:** ≤40 or ≥131 bpm are the NEWS2 score-3 boundaries used here for
> URGENT. Rate extremes become EMERGENCY when paired with syncope, chest pain, or
> severe dyspnea.

### 6.2 Red-flag symptoms → EMERGENCY (regardless of numbers)

Per `MEDICAL_SAFETY_RULES §3.1`, any of the following triggers `EMERGENCY`
("seek emergency care now"), and the engine **suppresses reassuring copy**:

| Pattern | Recognizer | Citation |
|---|---|---|
| Chest pain / pressure | Central chest pain/pressure, esp. with sweating, nausea, arm/jaw radiation, breathlessness | AHA (ACS warning signs) |
| Stroke — **FAST** | **F**ace droop, **A**rm weakness, **S**peech difficulty, **T**ime to call emergency; also sudden numbness, confusion, vision loss, severe imbalance | AHA/ASA (FAST / BE-FAST) |
| Severe dyspnea | Severe/sudden shortness of breath, can't speak full sentences, blue lips | Clinical (with SpO₂ §6.1) |
| Syncope / LOC | Fainting or loss of consciousness | `MEDICAL_SAFETY_RULES §3.1` |
| Severe weakness / sudden severe headache | Sudden one-sided weakness; "worst-ever"/thunderclap headache | AHA/ASA |
| DKA pattern | Known/possible diabetes **with** high glucose + nausea/vomiting, abdominal pain, deep/rapid breathing, fruity breath, drowsiness/confusion | ADA Hyperglycemic Crises Consensus 2024 |

> The app recognizes the **symptom pattern**, not laboratory confirmation of
> DKA/HHS. When a DKA-pattern cluster is reported, escalate to EMERGENCY and do
> not attempt to compute or rule out acidosis.

---

## 7. Source register (for the citation field in code)

| Domain | Guideline body | Specific source |
|---|---|---|
| Hypertension (primary) | ACC/AHA | Whelton PK et al. 2017 ACC/AHA High BP in Adults Guideline. *Hypertension* 2018;71:e13–e115 / *JACC* 2018;71:2199 |
| Hypertension (divergence) | ESH / ESC | 2023 ESH Guidelines, *J Hypertens* 2023;41:1874–2071; 2024 ESC Guidelines, *Eur Heart J* 2024 |
| Diabetes diagnosis & targets | ADA | *Standards of Care in Diabetes* §2 & §6, *Diabetes Care* Suppl. (2025/2026); §6 2025 = PMID 39651981 |
| Hyperglycemic crises (DKA/HHS) | ADA/EASD/AACE/JBDS | Hyperglycemic Crises in Adults consensus, *Diabetes Care* 2024;47:1257 / *Diabetologia* 2024 |
| CKD staging (GFR, UACR) | KDIGO | KDIGO 2024 CKD Guideline, *Kidney Int* 2024;105(4S):S117–S314 |
| Hyperkalemia | ERC / standard refs | European Resuscitation Council severity bands; standard clinical references |
| Lipids | ACC/AHA + NCEP | 2018 AHA/ACC/Multisociety Cholesterol Guideline, *Circulation* 2019;139:e1082; NCEP ATP III strata |
| BMI / waist | WHO / NCEP | WHO adult BMI classification; NCEP ATP III waist cutoffs |
| Metabolic syndrome | IDF/AHA/NHLBI et al. | Harmonizing the Metabolic Syndrome, *Circulation* 2009;120:1640 |
| Early-warning vitals | RCP (NEWS2) / WHO | Royal College of Physicians NEWS2; WHO hypoxemia definition |
| Stroke/ACS symptoms | AHA/ASA | FAST / BE-FAST; ACS warning signs |

> PubMed is acknowledged as a source for locating/verifying the peer-reviewed
> guideline publications cited above (e.g. ADA *Standards of Care* §6, 2025,
> PMID 39651981). Verify each citation's current edition before release.

---

## 8. Open items for Clinical Safety Officer sign-off

- [ ] Confirm the app's **EMERGENCY** severe-hyperglycemia number (draft uses
      ≥400 mg/dL) vs an alternative (e.g. ≥500) — no single guideline fixes a home
      "call 911" glucose; this is an app safety choice.
- [ ] Confirm hyperkalemia band split (draft uses ERC 5.5/6.0/6.5) and the
      EMERGENCY anchor (draft ≥6.5).
- [ ] Confirm SpO₂ URGENT trigger (<92%) vs WHO hypoxemia (<90%).
- [ ] Confirm whether Stage 2 hypertension (≥140/90) alone should ever auto-URGENT
      absent symptoms, or remain ROUTINE-educational.
- [ ] Confirm Asian-specific BMI/waist action points are surfaced where relevant.
- [ ] Sign, date, and version this table set into `lib/medical-rules`.
_Last edited: 2026-07-09 · Status: DRAFT · Awaiting CSO sign-off._
