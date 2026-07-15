import type { LabType } from '@prisma/client';
import type { CareModule } from '@/lib/clinical/conditions';

/**
 * Suggests preventive-care MONITORING reminders (checks, labs, appointments)
 * from the patient's conditions and how recently they were measured. These are
 * educational, cited nudges toward routine monitoring — never a diagnosis, and
 * never advice to start/stop/change a medication (docs/MEDICAL_SAFETY_RULES.md).
 * Pure and unit-tested.
 */
export interface PreventiveSuggestion {
  key: string;
  title: string;
  detail: string;
  cadence: string; // becomes the reminder's schedule when accepted
  /** Recommended interval in days — also used to re-surface after acceptance. */
  cadenceDays: number;
  citation: string;
}

/** Direction of a flagged latest blood-pressure reading (or null if in range). */
export type BpFlag = 'high' | 'low' | null;

export interface PreventiveInput {
  modules: CareModule[];
  /** Most recent recorded date per lab type (absent = never recorded). */
  labDates: Partial<Record<LabType, Date>>;
  bpFlag: BpFlag;
  today: Date;
}

const DAY = 86_400_000;
const daysSince = (d: Date, today: Date) =>
  Math.floor((today.getTime() - d.getTime()) / DAY);

function overdue(date: Date | undefined, maxDays: number, today: Date): boolean {
  return !date || daysSince(date, today) > maxDays;
}

export function suggestPreventive(input: PreventiveInput): PreventiveSuggestion[] {
  const { modules, labDates, bpFlag, today } = input;
  const has = (m: CareModule) => modules.includes(m);
  const out = new Map<string, PreventiveSuggestion>();

  const lastNote = (t: LabType) => {
    const d = labDates[t];
    return d ? `Last recorded ${daysSince(d, today)} days ago.` : 'None on record yet.';
  };

  if (has('diabetes')) {
    // ADA checks HbA1c at least twice a year at goal, and about quarterly when
    // not at goal or after a change — so surface at 6 months and say so.
    if (overdue(labDates.HBA1C, 180, today)) {
      out.set('hba1c', {
        key: 'hba1c',
        title: 'HbA1c check',
        cadence: 'Every 3–6 months',
        cadenceDays: 180,
        citation: 'ADA Standards of Care in Diabetes',
        detail: `${lastNote('HBA1C')} An HbA1c is generally checked every 3–6 months — more often if your levels or treatment are changing.`,
      });
    }
    out.set('eye-exam', {
      key: 'eye-exam',
      title: 'Diabetic eye exam',
      cadence: 'Yearly',
      cadenceDays: 365,
      citation: 'ADA Standards of Care in Diabetes',
      detail: 'An annual dilated eye exam is recommended when you have diabetes.',
    });
  }

  if ((has('diabetes') || has('ckd')) && overdue(labDates.EGFR, 365, today)) {
    out.set('kidney', {
      key: 'kidney',
      title: 'Kidney check (eGFR + urine albumin)',
      cadence: 'Yearly',
      cadenceDays: 365,
      citation: 'KDIGO / ADA',
      detail: `${lastNote('EGFR')} A yearly kidney check is recommended for diabetes or CKD.`,
    });
  }

  if ((has('diabetes') || has('dyslipidemia')) && overdue(labDates.LDL, 365, today)) {
    out.set('lipid', {
      key: 'lipid',
      title: 'Cholesterol (lipid panel)',
      cadence: 'Yearly',
      cadenceDays: 365,
      // Annual lipid testing in diabetes is an ADA recommendation; ACC/AHA
      // covers lipid/statin monitoring for dyslipidemia.
      citation: 'ADA / ACC/AHA',
      detail: `${lastNote('LDL')} A lipid panel is generally checked about yearly with diabetes; discuss the right interval with your clinician.`,
    });
  }

  if (has('hypertension') && bpFlag) {
    out.set('bp-recheck', {
      key: 'bp-recheck',
      title: 'Blood-pressure recheck',
      cadence: 'Within a few days',
      cadenceDays: 7,
      citation: 'ACC/AHA 2017 high blood pressure guideline',
      detail:
        bpFlag === 'low'
          ? 'Your latest reading was low — recheck when able, and contact your care team promptly if you feel unwell (dizzy or faint) or it stays low.'
          : 'Your latest reading was high — recheck when rested, and contact your care team promptly if it stays high or you feel unwell.',
    });
  }

  return [...out.values()];
}
