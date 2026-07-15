import type {
  Allergy,
  Condition,
  Document as DocRecord,
  Encounter,
  LabResult,
  Medication,
  PatientProfile,
  VitalObservation,
} from '@prisma/client';
import {
  BP_COMPONENT_LOINC,
  LAB_LOINC,
  SYSTEMS,
  VITAL_LOINC,
} from './codes';

// FHIR R4 resources are emitted as plain objects (already conformant shapes).
export type FhirResource = Record<string, unknown>;

const UCUM: Record<string, string> = {
  mmHg: 'mm[Hg]',
  'mg/dL': 'mg/dL',
  'mmol/L': 'mmol/L',
  kg: 'kg',
  lb: '[lb_av]',
  bpm: '/min',
  '°C': 'Cel',
  '°F': '[degF]',
  '%': '%',
  cm: 'cm',
  in: '[in_i]',
  'mL/min/1.73m²': 'mL/min/{1.73_m2}',
  'mg/g': 'mg/g',
  'µmol/L': 'umol/L',
};

function quantity(value: number, unit: string) {
  return { value, unit, system: SYSTEMS.UCUM, code: UCUM[unit] ?? unit };
}

function subject(patientId: string) {
  return { reference: `Patient/${patientId}` };
}

const CLINICAL_STATUS: Record<string, string> = {
  ACTIVE: 'active',
  RESOLVED: 'resolved',
  REMISSION: 'remission',
  INACTIVE: 'inactive',
};

const CRITICALITY: Record<string, string> = {
  HIGH: 'high',
  LOW: 'low',
  UNABLE_TO_ASSESS: 'unable-to-assess',
};

export function toFhirPatient(p: PatientProfile, userId: string): FhirResource {
  const name =
    p.givenName || p.familyName
      ? [
          {
            ...(p.familyName ? { family: p.familyName } : {}),
            ...(p.givenName ? { given: [p.givenName] } : {}),
          },
        ]
      : undefined;
  return {
    resourceType: 'Patient',
    id: userId,
    ...(name ? { name } : {}),
    ...(p.sex && p.sex !== 'prefer_not'
      ? { gender: p.sex === 'male' ? 'male' : p.sex === 'female' ? 'female' : 'other' }
      : {}),
    ...(p.birthDate ? { birthDate: p.birthDate.toISOString().slice(0, 10) } : {}),
  };
}

export function toFhirVital(v: VitalObservation, patientId: string): FhirResource {
  const loinc = VITAL_LOINC[v.type];
  const base: FhirResource = {
    resourceType: 'Observation',
    id: v.id,
    status: 'final',
    category: [{ coding: [{ code: 'vital-signs' }] }],
    code: { coding: [{ system: SYSTEMS.LOINC, ...loinc }], text: loinc.display },
    subject: subject(patientId),
    effectiveDateTime: v.recordedAt.toISOString(),
  };
  if (v.type === 'BLOOD_PRESSURE' && v.valueSecondary != null) {
    base.component = [
      { code: { coding: [{ system: SYSTEMS.LOINC, ...BP_COMPONENT_LOINC.systolic }] }, valueQuantity: quantity(v.valueNumeric ?? 0, v.unit) },
      { code: { coding: [{ system: SYSTEMS.LOINC, ...BP_COMPONENT_LOINC.diastolic }] }, valueQuantity: quantity(v.valueSecondary, v.unit) },
    ];
  } else if (v.valueNumeric != null) {
    base.valueQuantity = quantity(v.valueNumeric, v.unit);
  }
  return base;
}

export function toFhirLab(l: LabResult, patientId: string): FhirResource {
  const loinc = LAB_LOINC[l.type];
  return {
    resourceType: 'Observation',
    id: l.id,
    status: 'final',
    category: [{ coding: [{ code: 'laboratory' }] }],
    code: { coding: [{ system: SYSTEMS.LOINC, ...loinc }], text: loinc.display },
    subject: subject(patientId),
    effectiveDateTime: l.recordedAt.toISOString(),
    valueQuantity: quantity(l.value, l.unit),
  };
}

export function toFhirCondition(c: Condition, patientId: string): FhirResource {
  return {
    resourceType: 'Condition',
    id: c.id,
    clinicalStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: CLINICAL_STATUS[c.clinicalStatus] ?? 'active',
        },
      ],
    },
    code: {
      coding: [
        { system: SYSTEMS.SNOMED, code: c.code, display: c.display },
        ...(c.icd10 ? [{ system: SYSTEMS.ICD10, code: c.icd10, display: c.display }] : []),
      ],
      text: c.display,
    },
    subject: subject(patientId),
    ...(c.onsetDate ? { onsetDateTime: c.onsetDate.toISOString() } : {}),
  };
}

export function toFhirMedicationRequest(m: Medication, patientId: string): FhirResource {
  return {
    resourceType: 'MedicationRequest',
    id: m.id,
    status: m.status === 'ACTIVE' ? 'active' : m.status === 'STOPPED' ? 'stopped' : 'completed',
    intent: 'order',
    medicationCodeableConcept: {
      ...(m.rxnorm ? { coding: [{ system: SYSTEMS.RXNORM, code: m.rxnorm, display: m.name }] } : {}),
      text: m.name,
    },
    subject: subject(patientId),
    ...(m.dosageText ? { dosageInstruction: [{ text: m.dosageText }] } : {}),
  };
}

export function toFhirAllergy(a: Allergy, patientId: string): FhirResource {
  return {
    resourceType: 'AllergyIntolerance',
    id: a.id,
    code: {
      ...(a.code ? { coding: [{ system: SYSTEMS.SNOMED, code: a.code, display: a.substance }] } : {}),
      text: a.substance,
    },
    ...(a.criticality ? { criticality: CRITICALITY[a.criticality] } : {}),
    patient: subject(patientId),
    ...(a.reaction ? { reaction: [{ manifestation: [{ text: a.reaction }] }] } : {}),
  };
}

export function toFhirEncounter(e: Encounter, patientId: string): FhirResource {
  return {
    resourceType: 'Encounter',
    id: e.id,
    status: 'finished',
    class: { code: e.type },
    subject: subject(patientId),
    period: { start: e.occurredAt.toISOString() },
    ...(e.reason ? { reasonCode: [{ text: e.reason }] } : {}),
  };
}

export function toFhirDocumentReference(d: DocRecord, patientId: string): FhirResource {
  return {
    resourceType: 'DocumentReference',
    id: d.id,
    status: 'current',
    subject: subject(patientId),
    date: d.createdAt.toISOString(),
    description: d.title,
    content: [
      {
        attachment: {
          contentType: d.mimeType,
          title: d.title,
          size: d.sizeBytes,
          hash: d.checksumSha256,
          url: `/api/documents/${d.id}`,
        },
      },
    ],
  };
}

export function bundle(
  patientId: string,
  resources: FhirResource[],
  timestamp: string,
): FhirResource {
  return {
    resourceType: 'Bundle',
    type: 'collection',
    timestamp,
    entry: resources.map((resource) => ({
      fullUrl: `urn:uuid:${resource.id ?? patientId}`,
      resource,
    })),
  };
}
