import { newId, nowInstant } from './ids';
import { concept, quantity, type CodeableConcept } from './primitives';
import { OBSERVATIONS, type ObservationKey } from './valuesets/observations';
import type {
  AllergyIntolerance,
  Condition,
  MedicationStatement,
  Observation,
  Patient,
} from './resources';

/** Build a single-value observation (e.g. glucose, weight) from the catalog. */
export function makeObservation(
  key: Exclude<ObservationKey, 'bloodPressure'>,
  value: number,
  unit: { unit: string; code: string },
  effectiveDateTime: string,
  note?: string,
): Observation {
  const def = OBSERVATIONS[key];
  return {
    resourceType: 'Observation',
    id: newId(),
    updatedAt: nowInstant(),
    status: 'final',
    code: concept(def.loinc),
    effectiveDateTime,
    valueQuantity: quantity(value, unit.unit, unit.code),
    ...(note ? { note } : {}),
  };
}

/** Build a blood-pressure panel observation with systolic/diastolic components. */
export function makeBloodPressure(
  systolic: number,
  diastolic: number,
  effectiveDateTime: string,
  note?: string,
): Observation {
  const def = OBSERVATIONS.bloodPressure;
  const [sys, dia] = def.components!;
  return {
    resourceType: 'Observation',
    id: newId(),
    updatedAt: nowInstant(),
    status: 'final',
    code: concept(def.loinc),
    effectiveDateTime,
    components: [
      { code: concept(sys!.loinc), valueQuantity: quantity(systolic, sys!.unit.unit, sys!.unit.code) },
      { code: concept(dia!.loinc), valueQuantity: quantity(diastolic, dia!.unit.unit, dia!.unit.code) },
    ],
    ...(note ? { note } : {}),
  };
}

export function makeCondition(
  code: CodeableConcept,
  onsetDate?: string,
  note?: string,
): Condition {
  return {
    resourceType: 'Condition',
    id: newId(),
    updatedAt: nowInstant(),
    code,
    clinicalStatus: 'active',
    ...(onsetDate ? { onsetDate } : {}),
    ...(note ? { note } : {}),
  };
}

export function makeMedication(
  text: string,
  dosageText?: string,
  effectiveStart?: string,
): MedicationStatement {
  return {
    resourceType: 'MedicationStatement',
    id: newId(),
    updatedAt: nowInstant(),
    medication: { coding: [], text },
    status: 'active',
    ...(dosageText ? { dosageText } : {}),
    ...(effectiveStart ? { effectiveStart } : {}),
  };
}

export function makeAllergy(
  text: string,
  criticality?: AllergyIntolerance['criticality'],
  reaction?: string,
): AllergyIntolerance {
  return {
    resourceType: 'AllergyIntolerance',
    id: newId(),
    updatedAt: nowInstant(),
    code: { coding: [], text },
    ...(criticality ? { criticality } : {}),
    ...(reaction ? { reaction } : {}),
  };
}

export function makePatient(fields: Partial<Omit<Patient, 'resourceType' | 'id' | 'updatedAt'>>): Patient {
  return {
    resourceType: 'Patient',
    id: 'patient-self',
    updatedAt: nowInstant(),
    ...fields,
  };
}
