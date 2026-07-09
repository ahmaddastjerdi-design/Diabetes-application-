import { describe, expect, it } from 'vitest';
import { toFhirBundle } from './fhir';
import { buildReport } from './summary';
import {
  makeAllergy,
  makeBloodPressure,
  makeCondition,
  makeMedication,
  makeObservation,
  makePatient,
} from '../../domain/factories';
import { CONDITION_CATALOG } from '../../domain/valuesets/conditions';
import type { HealthResource } from '../../domain/resources';

const NOW = '2026-07-09T08:00:00.000Z';

function sampleRecord(): HealthResource[] {
  const dm = CONDITION_CATALOG.find((c) => c.key === 'type2-diabetes')!;
  return [
    makePatient({ givenName: 'Sam', familyName: 'Rivera', gender: 'female', birthDate: '1980-05-01' }),
    makeObservation('glucose', 45, { unit: 'mg/dL', code: 'mg/dL' }, NOW),
    makeBloodPressure(150, 95, NOW),
    makeCondition(dm.concept, '2020-01-01'),
    makeMedication('Metformin', '500 mg twice daily'),
    makeAllergy('Penicillin', 'high', 'rash'),
  ];
}

describe('toFhirBundle', () => {
  it('produces a conformant collection Bundle with mapped resources', () => {
    const bundle = toFhirBundle(sampleRecord(), NOW);
    expect(bundle.resourceType).toBe('Bundle');
    expect(bundle.type).toBe('collection');
    expect(bundle.entry).toHaveLength(6);

    const types = bundle.entry.map((e) => e.resource.resourceType);
    expect(types).toContain('Patient');
    expect(types).toContain('Observation');
    expect(types).toContain('MedicationStatement');
    expect(types).toContain('AllergyIntolerance');
  });

  it('maps a blood-pressure panel to FHIR components', () => {
    const bundle = toFhirBundle([makeBloodPressure(120, 80, NOW)], NOW);
    const obs = bundle.entry[0]!.resource as Record<string, unknown>;
    expect(Array.isArray(obs.component)).toBe(true);
    expect((obs.component as unknown[]).length).toBe(2);
    expect(obs.valueQuantity).toBeUndefined();
  });

  it('uses medicationCodeableConcept and patient reference per FHIR R4', () => {
    const bundle = toFhirBundle(sampleRecord(), NOW);
    const med = bundle.entry.find(
      (e) => e.resource.resourceType === 'MedicationStatement',
    )!.resource as Record<string, unknown>;
    expect(med.medicationCodeableConcept).toBeDefined();

    const allergy = bundle.entry.find(
      (e) => e.resource.resourceType === 'AllergyIntolerance',
    )!.resource as Record<string, unknown>;
    expect((allergy.patient as { reference: string }).reference).toMatch(/^Patient\//);
  });
});

describe('buildReport', () => {
  it('summarizes patient, problems, meds, allergies, and latest vitals', () => {
    const report = buildReport(sampleRecord(), NOW);
    expect(report.patient.name).toBe('Sam Rivera');
    expect(report.conditions[0]?.text).toBe('Type 2 diabetes mellitus');
    expect(report.medications[0]?.text).toBe('Metformin');
    expect(report.allergies[0]?.text).toBe('Penicillin');
    expect(report.vitals.latestGlucoseMgdl?.value).toBe(45);
    expect(report.vitals.latestBp).toEqual({ systolic: 150, diastolic: 95, at: NOW });
  });

  it('surfaces red-flag readings as report flags', () => {
    const report = buildReport(sampleRecord(), NOW);
    // Glucose 45 mg/dL (severe hypo) and BP 150/95 both flagged.
    expect(report.flags.length).toBeGreaterThanOrEqual(1);
    expect(report.flags.some((f) => f.disposition === 'EMERGENCY')).toBe(true);
  });

  it('handles an empty record without throwing', () => {
    const report = buildReport([], NOW);
    expect(report.conditions).toHaveLength(0);
    expect(report.vitals.glucoseCount).toBe(0);
    expect(report.flags).toHaveLength(0);
  });
});
