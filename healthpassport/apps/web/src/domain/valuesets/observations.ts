import { SYSTEMS, type Coding } from '../primitives';

/**
 * Curated LOINC catalog for the readings a chronic-care PHR needs.
 * Sources: LOINC (loinc.org). Units follow UCUM.
 * Expand deliberately; every entry is reviewed (see docs/INTEROPERABILITY.md).
 */
export type ObservationKey =
  | 'glucose'
  | 'hba1c'
  | 'bloodPressure'
  | 'weight'
  | 'heartRate'
  | 'bodyTemperature'
  | 'ldl';

export interface UnitDef {
  /** Human-readable unit label. */
  unit: string;
  /** UCUM code. */
  code: string;
}

export interface ObservationDef {
  key: ObservationKey;
  loinc: Coding;
  category: 'vital-signs' | 'laboratory';
  /** Canonical unit stored internally. */
  canonicalUnit: UnitDef;
  /** Alternate units the UI may offer (with conversion in domain/units). */
  altUnits?: UnitDef[];
  /** For panel observations (e.g. blood pressure) — the components. */
  components?: Array<{ key: 'systolic' | 'diastolic'; loinc: Coding; unit: UnitDef }>;
}

const loinc = (code: string, display: string): Coding => ({
  system: SYSTEMS.LOINC,
  code,
  display,
});

export const OBSERVATIONS: Record<ObservationKey, ObservationDef> = {
  glucose: {
    key: 'glucose',
    loinc: loinc('2339-0', 'Glucose [Mass/volume] in Blood'),
    category: 'laboratory',
    canonicalUnit: { unit: 'mg/dL', code: 'mg/dL' },
    altUnits: [{ unit: 'mmol/L', code: 'mmol/L' }],
  },
  hba1c: {
    key: 'hba1c',
    loinc: loinc('4548-4', 'Hemoglobin A1c/Hemoglobin.total in Blood'),
    category: 'laboratory',
    canonicalUnit: { unit: '%', code: '%' },
  },
  bloodPressure: {
    key: 'bloodPressure',
    loinc: loinc('85354-9', 'Blood pressure panel'),
    category: 'vital-signs',
    canonicalUnit: { unit: 'mmHg', code: 'mm[Hg]' },
    components: [
      {
        key: 'systolic',
        loinc: loinc('8480-6', 'Systolic blood pressure'),
        unit: { unit: 'mmHg', code: 'mm[Hg]' },
      },
      {
        key: 'diastolic',
        loinc: loinc('8462-4', 'Diastolic blood pressure'),
        unit: { unit: 'mmHg', code: 'mm[Hg]' },
      },
    ],
  },
  weight: {
    key: 'weight',
    loinc: loinc('29463-7', 'Body weight'),
    category: 'vital-signs',
    canonicalUnit: { unit: 'kg', code: 'kg' },
    altUnits: [{ unit: 'lb', code: '[lb_av]' }],
  },
  heartRate: {
    key: 'heartRate',
    loinc: loinc('8867-4', 'Heart rate'),
    category: 'vital-signs',
    canonicalUnit: { unit: 'beats/min', code: '/min' },
  },
  bodyTemperature: {
    key: 'bodyTemperature',
    loinc: loinc('8310-5', 'Body temperature'),
    category: 'vital-signs',
    canonicalUnit: { unit: '°C', code: 'Cel' },
    altUnits: [{ unit: '°F', code: '[degF]' }],
  },
  ldl: {
    key: 'ldl',
    loinc: loinc('13457-7', 'LDL cholesterol (calculated)'),
    category: 'laboratory',
    canonicalUnit: { unit: 'mg/dL', code: 'mg/dL' },
    altUnits: [{ unit: 'mmol/L', code: 'mmol/L' }],
  },
};

export const OBSERVATION_LIST: ObservationDef[] = Object.values(OBSERVATIONS);
