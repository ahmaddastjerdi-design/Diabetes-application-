import type { HealthResource, Observation } from '../../domain/resources';
import { OBSERVATIONS } from '../../domain/valuesets/observations';
import { evaluateObservation } from '../../safety/engine';
import type { Disposition } from '../../safety/types';
import {
  bloodPressureSeries,
  estimatedA1c,
  glucoseSeries,
  latest,
} from '../care/analytics';

export interface ReportFlag {
  disposition: Disposition;
  detail: string;
}

export interface ReportModel {
  generatedAt: string;
  patient: { name?: string; birthDate?: string; gender?: string };
  conditions: Array<{ text: string; onsetDate?: string }>;
  medications: Array<{ text: string; dosage?: string }>;
  allergies: Array<{ text: string; criticality?: string; reaction?: string }>;
  vitals: {
    latestGlucoseMgdl?: { value: number; at: string };
    estimatedA1c?: number;
    latestHba1c?: { value: number; at: string };
    latestBp?: { systolic: number; diastolic: number; at: string };
    latestWeight?: { value: number; unit: string; at: string };
    glucoseCount: number;
    bpCount: number;
  };
  flags: ReportFlag[];
}

function latestOfLoinc(
  observations: Observation[],
  code: string,
): Observation | undefined {
  return observations
    .filter((o) => o.code.coding[0]?.code === code)
    .sort((a, b) => b.effectiveDateTime.localeCompare(a.effectiveDateTime))[0];
}

export function buildReport(
  resources: HealthResource[],
  generatedAt: string,
): ReportModel {
  const observations = resources.filter(
    (r): r is Observation => r.resourceType === 'Observation',
  );
  const conditions = resources.filter((r) => r.resourceType === 'Condition');
  const medications = resources.filter(
    (r) => r.resourceType === 'MedicationStatement',
  );
  const allergies = resources.filter(
    (r) => r.resourceType === 'AllergyIntolerance',
  );
  const patient = resources.find((r) => r.resourceType === 'Patient');

  const glucose = glucoseSeries(observations);
  const bp = bloodPressureSeries(observations);
  const lastGlucose = latest(glucose);
  const lastSys = latest(bp.systolic);
  const lastDia = latest(bp.diastolic);

  const hba1cObs = latestOfLoinc(observations, OBSERVATIONS.hba1c.loinc.code);
  const weightObs = latestOfLoinc(observations, OBSERVATIONS.weight.loinc.code);

  // Safety flags: evaluate the most recent glucose and blood-pressure readings.
  const flags: ReportFlag[] = [];
  for (const code of [
    OBSERVATIONS.glucose.loinc.code,
    OBSERVATIONS.bloodPressure.loinc.code,
  ]) {
    const obs = latestOfLoinc(observations, code);
    if (!obs) continue;
    const evaluation = evaluateObservation(obs);
    if (evaluation.disposition !== 'ROUTINE') {
      for (const f of evaluation.findings) {
        flags.push({ disposition: f.disposition, detail: f.detail });
      }
    }
  }

  const name =
    [patient?.givenName, patient?.familyName].filter(Boolean).join(' ') ||
    undefined;

  return {
    generatedAt,
    patient: {
      ...(name ? { name } : {}),
      ...(patient?.birthDate ? { birthDate: patient.birthDate } : {}),
      ...(patient?.gender && patient.gender !== 'unknown'
        ? { gender: patient.gender }
        : {}),
    },
    conditions: conditions.map((c) => ({
      text: c.code.text,
      ...(c.onsetDate ? { onsetDate: c.onsetDate } : {}),
    })),
    medications: medications.map((m) => ({
      text: m.medication.text,
      ...(m.dosageText ? { dosage: m.dosageText } : {}),
    })),
    allergies: allergies.map((a) => ({
      text: a.code.text,
      ...(a.criticality ? { criticality: a.criticality } : {}),
      ...(a.reaction ? { reaction: a.reaction } : {}),
    })),
    vitals: {
      ...(lastGlucose
        ? { latestGlucoseMgdl: { value: Math.round(lastGlucose.value), at: lastGlucose.at } }
        : {}),
      ...(estimatedA1c(glucose) !== undefined
        ? { estimatedA1c: estimatedA1c(glucose) }
        : {}),
      ...(hba1cObs?.valueQuantity
        ? { latestHba1c: { value: hba1cObs.valueQuantity.value, at: hba1cObs.effectiveDateTime } }
        : {}),
      ...(lastSys && lastDia
        ? { latestBp: { systolic: lastSys.value, diastolic: lastDia.value, at: lastSys.at } }
        : {}),
      ...(weightObs?.valueQuantity
        ? {
            latestWeight: {
              value: weightObs.valueQuantity.value,
              unit: weightObs.valueQuantity.unit,
              at: weightObs.effectiveDateTime,
            },
          }
        : {}),
      glucoseCount: glucose.length,
      bpCount: bp.systolic.length,
    },
    flags,
  };
}
