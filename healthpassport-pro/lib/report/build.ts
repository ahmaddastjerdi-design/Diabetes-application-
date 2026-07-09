import {
  getProfile,
} from '@/lib/data/profile';
import {
  listAllergies,
  listConditions,
  listEncounters,
  listMedications,
} from '@/lib/data/records';
import { listLabs, listSymptoms, listVitals } from '@/lib/data/tracking';
import { listDocuments } from '@/lib/data/documents';
import { VITAL_META, LAB_META } from '@/lib/clinical/measurements';
import { evaluateLab, evaluateVital, type Disposition } from '@/lib/medical-rules';
import {
  bundle,
  toFhirAllergy,
  toFhirCondition,
  toFhirDocumentReference,
  toFhirEncounter,
  toFhirLab,
  toFhirMedicationRequest,
  toFhirPatient,
  toFhirVital,
  type FhirResource,
} from '@/lib/fhir/mapping';

export interface ReportFlag {
  disposition: Exclude<Disposition, 'ROUTINE'>;
  detail: string;
}

export interface ReportSummary {
  generatedAt: string;
  patient: { name?: string; birthDate?: string; sex?: string };
  conditions: Array<{ display: string; status: string; onset?: string }>;
  medications: Array<{ name: string; dosage?: string; status: string }>;
  allergies: Array<{ substance: string; criticality?: string; reaction?: string }>;
  latestVitals: Array<{ label: string; value: string; recordedAt: string }>;
  latestLabs: Array<{ label: string; value: string; recordedAt: string }>;
  flags: ReportFlag[];
}

export interface DoctorReport {
  summary: ReportSummary;
  fhir: FhirResource;
}

/** Gather the patient's record (all scoped by userId) into a report + FHIR bundle. */
export async function buildDoctorReport(
  userId: string,
  generatedAt: string,
): Promise<DoctorReport> {
  const [profile, conditions, medications, allergies, vitals, labs, encounters, documents] =
    await Promise.all([
      getProfile(userId),
      listConditions(userId),
      listMedications(userId),
      listAllergies(userId),
      listVitals(userId),
      listLabs(userId),
      listEncounters(userId),
      listDocuments(userId),
    ]);
  await listSymptoms(userId); // reserved for a future symptom section

  // Latest reading per measurement type.
  const latestVital = new Map<string, (typeof vitals)[number]>();
  for (const v of vitals) if (!latestVital.has(v.type)) latestVital.set(v.type, v);
  const latestLab = new Map<string, (typeof labs)[number]>();
  for (const l of labs) if (!latestLab.has(l.type)) latestLab.set(l.type, l);

  const flags: ReportFlag[] = [];
  for (const v of latestVital.values()) {
    const e = evaluateVital(v.type, v.valueNumeric ?? 0, v.unit, v.valueSecondary ?? undefined);
    for (const f of e.findings) flags.push({ disposition: f.disposition, detail: f.detail });
  }
  for (const l of latestLab.values()) {
    for (const f of evaluateLab(l.type, l.value).findings)
      flags.push({ disposition: f.disposition, detail: f.detail });
  }

  const name = [profile?.givenName, profile?.familyName].filter(Boolean).join(' ') || undefined;

  const summary: ReportSummary = {
    generatedAt,
    patient: {
      ...(name ? { name } : {}),
      ...(profile?.birthDate ? { birthDate: profile.birthDate.toISOString().slice(0, 10) } : {}),
      ...(profile?.sex && profile.sex !== 'prefer_not' ? { sex: profile.sex } : {}),
    },
    conditions: conditions.map((c) => ({
      display: c.display,
      status: c.clinicalStatus,
      ...(c.onsetDate ? { onset: c.onsetDate.toISOString().slice(0, 10) } : {}),
    })),
    medications: medications.map((m) => ({
      name: m.name,
      ...(m.dosageText ? { dosage: m.dosageText } : {}),
      status: m.status,
    })),
    allergies: allergies.map((a) => ({
      substance: a.substance,
      ...(a.criticality ? { criticality: a.criticality } : {}),
      ...(a.reaction ? { reaction: a.reaction } : {}),
    })),
    latestVitals: [...latestVital.values()].map((v) => ({
      label: VITAL_META[v.type].label,
      value:
        v.type === 'BLOOD_PRESSURE'
          ? `${v.valueNumeric}/${v.valueSecondary} ${v.unit}`
          : `${v.valueNumeric} ${v.unit}`,
      recordedAt: v.recordedAt.toISOString().slice(0, 10),
    })),
    latestLabs: [...latestLab.values()].map((l) => ({
      label: LAB_META[l.type].label,
      value: `${l.value} ${l.unit}`,
      recordedAt: l.recordedAt.toISOString().slice(0, 10),
    })),
    flags,
  };

  const resources: FhirResource[] = [];
  if (profile) resources.push(toFhirPatient(profile, userId));
  for (const c of conditions) resources.push(toFhirCondition(c, userId));
  for (const m of medications) resources.push(toFhirMedicationRequest(m, userId));
  for (const a of allergies) resources.push(toFhirAllergy(a, userId));
  for (const v of vitals) resources.push(toFhirVital(v, userId));
  for (const l of labs) resources.push(toFhirLab(l, userId));
  for (const e of encounters) resources.push(toFhirEncounter(e, userId));
  for (const d of documents) resources.push(toFhirDocumentReference(d, userId));

  return { summary, fhir: bundle(userId, resources, generatedAt) };
}
