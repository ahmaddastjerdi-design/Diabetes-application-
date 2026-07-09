import type { LabType, VitalType } from '@prisma/client';

export interface MeasurementMeta {
  label: string;
  units: string[];
}

export const VITAL_META: Record<VitalType, MeasurementMeta> = {
  BLOOD_PRESSURE: { label: 'Blood pressure', units: ['mmHg'] },
  GLUCOSE: { label: 'Blood glucose', units: ['mg/dL', 'mmol/L'] },
  WEIGHT: { label: 'Weight', units: ['kg', 'lb'] },
  HEART_RATE: { label: 'Heart rate', units: ['bpm'] },
  TEMPERATURE: { label: 'Temperature', units: ['°C', '°F'] },
  SPO2: { label: 'Oxygen saturation (SpO₂)', units: ['%'] },
  WAIST: { label: 'Waist circumference', units: ['cm', 'in'] },
};

export const LAB_META: Record<LabType, MeasurementMeta> = {
  HBA1C: { label: 'HbA1c', units: ['%'] },
  LDL: { label: 'LDL cholesterol', units: ['mg/dL', 'mmol/L'] },
  HDL: { label: 'HDL cholesterol', units: ['mg/dL', 'mmol/L'] },
  TRIGLYCERIDES: { label: 'Triglycerides', units: ['mg/dL', 'mmol/L'] },
  TOTAL_CHOLESTEROL: { label: 'Total cholesterol', units: ['mg/dL', 'mmol/L'] },
  CREATININE: { label: 'Creatinine', units: ['mg/dL', 'µmol/L'] },
  EGFR: { label: 'eGFR', units: ['mL/min/1.73m²'] },
  UACR: { label: 'Urine albumin/creatinine (UACR)', units: ['mg/g'] },
  POTASSIUM: { label: 'Potassium', units: ['mmol/L'] },
};
