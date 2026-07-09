import { SYSTEMS } from '../../domain/primitives';
import type {
  AllergyIntolerance,
  Condition,
  HealthResource,
  MedicationStatement,
  Observation,
  Patient,
} from '../../domain/resources';

/**
 * Serialize the internal (FHIR-aligned) resources into a conformant FHIR R4
 * Bundle. Because the internal model already carries standard codes, this is a
 * shape mapping, not a transformation (docs/INTEROPERABILITY.md, ADR-0003).
 */

type FhirResource = Record<string, unknown>;

const CATEGORY_SYSTEM =
  'http://terminology.hl7.org/CodeSystem/observation-category';
const CONDITION_CLINICAL_SYSTEM =
  'http://terminology.hl7.org/CodeSystem/condition-clinical';

function subject(patientId: string) {
  return { reference: `Patient/${patientId}` };
}

function patientToFhir(p: Patient): FhirResource {
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
    id: p.id,
    ...(name ? { name } : {}),
    ...(p.gender ? { gender: p.gender } : {}),
    ...(p.birthDate ? { birthDate: p.birthDate } : {}),
    ...(p.preferredLanguage
      ? {
          communication: [
            { language: { text: p.preferredLanguage }, preferred: true },
          ],
        }
      : {}),
  };
}

function observationToFhir(o: Observation, patientId: string): FhirResource {
  const base: FhirResource = {
    resourceType: 'Observation',
    id: o.id,
    status: o.status,
    code: o.code,
    subject: subject(patientId),
    effectiveDateTime: o.effectiveDateTime,
    ...(o.note ? { note: [{ text: o.note }] } : {}),
  };
  if (o.components?.length) {
    base.component = o.components.map((c) => ({
      code: c.code,
      valueQuantity: c.valueQuantity,
    }));
  } else if (o.valueQuantity) {
    base.valueQuantity = o.valueQuantity;
    base.category = [
      { coding: [{ system: CATEGORY_SYSTEM, code: 'vital-signs' }] },
    ];
  }
  return base;
}

function conditionToFhir(c: Condition, patientId: string): FhirResource {
  return {
    resourceType: 'Condition',
    id: c.id,
    clinicalStatus: {
      coding: [{ system: CONDITION_CLINICAL_SYSTEM, code: c.clinicalStatus }],
    },
    code: c.code,
    subject: subject(patientId),
    ...(c.onsetDate ? { onsetDateTime: c.onsetDate } : {}),
    ...(c.note ? { note: [{ text: c.note }] } : {}),
  };
}

function medicationToFhir(m: MedicationStatement, patientId: string): FhirResource {
  return {
    resourceType: 'MedicationStatement',
    id: m.id,
    status: m.status,
    medicationCodeableConcept: m.medication,
    subject: subject(patientId),
    ...(m.effectiveStart ? { effectiveDateTime: m.effectiveStart } : {}),
    ...(m.dosageText ? { dosage: [{ text: m.dosageText }] } : {}),
  };
}

function allergyToFhir(a: AllergyIntolerance, patientId: string): FhirResource {
  return {
    resourceType: 'AllergyIntolerance',
    id: a.id,
    code: a.code,
    ...(a.criticality ? { criticality: a.criticality } : {}),
    patient: subject(patientId),
    ...(a.reaction
      ? { reaction: [{ manifestation: [{ text: a.reaction }] }] }
      : {}),
  };
}

export function resourceToFhir(
  resource: HealthResource,
  patientId: string,
): FhirResource {
  switch (resource.resourceType) {
    case 'Patient':
      return patientToFhir(resource);
    case 'Observation':
      return observationToFhir(resource, patientId);
    case 'Condition':
      return conditionToFhir(resource, patientId);
    case 'MedicationStatement':
      return medicationToFhir(resource, patientId);
    case 'AllergyIntolerance':
      return allergyToFhir(resource, patientId);
  }
}

export interface FhirBundle {
  resourceType: 'Bundle';
  type: 'collection';
  timestamp: string;
  entry: Array<{ resource: FhirResource }>;
}

export function toFhirBundle(
  resources: HealthResource[],
  generatedAt: string,
): FhirBundle {
  const patient = resources.find((r) => r.resourceType === 'Patient');
  const patientId = patient?.id ?? 'patient-self';
  return {
    resourceType: 'Bundle',
    type: 'collection',
    timestamp: generatedAt,
    entry: resources.map((r) => ({ resource: resourceToFhir(r, patientId) })),
  };
}

// Re-export for callers that build UCUM quantities in tests/tools.
export const UCUM_SYSTEM = SYSTEMS.UCUM;
