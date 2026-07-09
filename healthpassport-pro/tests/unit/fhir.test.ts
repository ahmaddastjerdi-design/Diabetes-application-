import { describe, expect, it } from 'vitest';
import type {
  Allergy,
  Condition,
  Medication,
  LabResult,
  VitalObservation,
} from '@prisma/client';
import {
  bundle,
  toFhirAllergy,
  toFhirCondition,
  toFhirLab,
  toFhirMedicationRequest,
  toFhirVital,
} from '@/lib/fhir/mapping';

const PID = 'patient-1';
const NOW = new Date('2026-07-09T08:00:00.000Z');

function vital(partial: Partial<VitalObservation>): VitalObservation {
  return { id: 'v1', userId: PID, unit: 'mmHg', recordedAt: NOW, valueSecondary: null, valueNumeric: 0, notes: null, source: 'PATIENT_ENTERED', createdAt: NOW, updatedAt: NOW, deletedAt: null, type: 'GLUCOSE', ...partial } as VitalObservation;
}

describe('FHIR Observation mapping', () => {
  it('maps blood pressure to component systolic/diastolic (no top-level value)', () => {
    const o = toFhirVital(
      vital({ type: 'BLOOD_PRESSURE', valueNumeric: 150, valueSecondary: 95, unit: 'mmHg' }),
      PID,
    ) as Record<string, unknown>;
    const comps = o.component as Array<Record<string, unknown>>;
    expect(comps).toHaveLength(2);
    expect(o.valueQuantity).toBeUndefined();
    const codes = comps.map((c) => (c.code as { coding: { code: string }[] }).coding[0]!.code);
    expect(codes).toEqual(['8480-6', '8462-4']);
  });

  it('maps glucose to a LOINC-coded valueQuantity with UCUM', () => {
    const o = toFhirVital(vital({ type: 'GLUCOSE', valueNumeric: 132, unit: 'mg/dL' }), PID) as Record<string, unknown>;
    expect((o.code as { coding: { code: string }[] }).coding[0]!.code).toBe('2339-0');
    expect(o.valueQuantity).toMatchObject({ value: 132, unit: 'mg/dL', code: 'mg/dL' });
  });

  it('maps a lab result to a laboratory Observation', () => {
    const lab = { id: 'l1', userId: PID, type: 'HBA1C', value: 7.1, unit: '%', recordedAt: NOW, referenceLow: null, referenceHigh: null, notes: null, source: 'PATIENT_ENTERED', createdAt: NOW, updatedAt: NOW, deletedAt: null } as LabResult;
    const o = toFhirLab(lab, PID) as Record<string, unknown>;
    expect((o.category as { coding: { code: string }[] }[])[0]!.coding[0]!.code).toBe('laboratory');
    expect((o.code as { coding: { code: string }[] }).coding[0]!.code).toBe('4548-4');
  });
});

describe('FHIR condition / medication / allergy mapping', () => {
  it('dual-codes a condition (SNOMED + ICD-10) with clinicalStatus', () => {
    const c = { id: 'c1', userId: PID, code: '44054006', icd10: 'E11', display: 'Type 2 diabetes mellitus', clinicalStatus: 'ACTIVE', onsetDate: null, encounterId: null, notes: null, source: 'PATIENT_ENTERED', createdAt: NOW, updatedAt: NOW, deletedAt: null } as Condition;
    const r = toFhirCondition(c, PID) as Record<string, unknown>;
    const codings = (r.code as { coding: { system: string; code: string }[] }).coding;
    expect(codings.map((x) => x.code)).toEqual(['44054006', 'E11']);
    expect((r.clinicalStatus as { coding: { code: string }[] }).coding[0]!.code).toBe('active');
  });

  it('maps a medication to MedicationRequest with dosage text', () => {
    const m = { id: 'm1', userId: PID, name: 'Metformin', rxnorm: null, atc: null, dosageText: '500 mg twice daily', status: 'ACTIVE', startDate: null, endDate: null, adherenceNote: null, notes: null, source: 'PATIENT_ENTERED', createdAt: NOW, updatedAt: NOW, deletedAt: null } as Medication;
    const r = toFhirMedicationRequest(m, PID) as Record<string, unknown>;
    expect(r.resourceType).toBe('MedicationRequest');
    expect((r.medicationCodeableConcept as { text: string }).text).toBe('Metformin');
    expect((r.dosageInstruction as { text: string }[])[0]!.text).toMatch(/twice daily/);
  });

  it('maps an allergy with patient reference and reaction', () => {
    const a = { id: 'a1', userId: PID, substance: 'Penicillin', code: null, criticality: 'HIGH', reaction: 'rash', notes: null, source: 'PATIENT_ENTERED', createdAt: NOW, updatedAt: NOW, deletedAt: null } as Allergy;
    const r = toFhirAllergy(a, PID) as Record<string, unknown>;
    expect((r.patient as { reference: string }).reference).toBe('Patient/patient-1');
    expect(r.criticality).toBe('high');
  });
});

describe('FHIR bundle', () => {
  it('wraps resources in a collection Bundle', () => {
    const b = bundle(PID, [toFhirVital(vital({ type: 'GLUCOSE', valueNumeric: 100, unit: 'mg/dL' }), PID)], NOW.toISOString()) as Record<string, unknown>;
    expect(b.resourceType).toBe('Bundle');
    expect(b.type).toBe('collection');
    expect((b.entry as unknown[]).length).toBe(1);
  });
});
