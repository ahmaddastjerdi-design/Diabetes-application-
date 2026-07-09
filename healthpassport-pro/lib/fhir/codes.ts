import type { LabType, VitalType } from '@prisma/client';

// FHIR terminology systems (canonical URLs) and the curated code catalog used
// by the mapping functions. See docs/FHIR_MAPPING.md.
export const SYSTEMS = {
  LOINC: 'http://loinc.org',
  SNOMED: 'http://snomed.info/sct',
  ICD10: 'http://hl7.org/fhir/sid/icd-10',
  RXNORM: 'http://www.nlm.nih.gov/research/umls/rxnorm',
  UCUM: 'http://unitsofmeasure.org',
} as const;

export interface Loinc {
  code: string;
  display: string;
}

export const VITAL_LOINC: Record<VitalType, Loinc> = {
  BLOOD_PRESSURE: { code: '85354-9', display: 'Blood pressure panel' },
  GLUCOSE: { code: '2339-0', display: 'Glucose [Mass/volume] in Blood' },
  WEIGHT: { code: '29463-7', display: 'Body weight' },
  HEART_RATE: { code: '8867-4', display: 'Heart rate' },
  TEMPERATURE: { code: '8310-5', display: 'Body temperature' },
  SPO2: { code: '59408-5', display: 'Oxygen saturation in Arterial blood by Pulse oximetry' },
  WAIST: { code: '8280-0', display: 'Waist circumference' },
};

export const BP_COMPONENT_LOINC = {
  systolic: { code: '8480-6', display: 'Systolic blood pressure' },
  diastolic: { code: '8462-4', display: 'Diastolic blood pressure' },
};

export const LAB_LOINC: Record<LabType, Loinc> = {
  HBA1C: { code: '4548-4', display: 'Hemoglobin A1c/Hemoglobin.total in Blood' },
  LDL: { code: '13457-7', display: 'LDL cholesterol (calculated)' },
  HDL: { code: '2085-9', display: 'HDL cholesterol' },
  TRIGLYCERIDES: { code: '2571-8', display: 'Triglycerides' },
  TOTAL_CHOLESTEROL: { code: '2093-3', display: 'Cholesterol total' },
  CREATININE: { code: '2160-0', display: 'Creatinine in Serum or Plasma' },
  EGFR: { code: '62238-1', display: 'Glomerular filtration rate (eGFR)' },
  UACR: { code: '9318-7', display: 'Albumin/Creatinine ratio in Urine' },
  POTASSIUM: { code: '2823-3', display: 'Potassium in Serum or Plasma' },
};
