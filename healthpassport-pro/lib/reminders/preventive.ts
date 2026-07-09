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
  citation: string;
}

export interface PreventiveInput {
  modules: CareModule[];
  /** Most recent recorded date per lab type (absent = never recorded). */
  labDates: Partial<Record<LabType, Date>>;
  /** Whether the latest blood-pressure reading is outside the reference range. */
  bpFlagged: boolean;
  today: Date;
}

const DAY = 86_400_000;
const daysSince = (d: Date, today: Date) =>
  Math.floor((today.getTime() - d.getTime()) / DAY);

function overdue(date: Date | undefined, maxDays: number, today: Date): boolean {
  return !date || daysSince(date, today) > maxDays;
}

export function suggestPreventive(input: PreventiveInput): PreventiveSuggestion[] {
  const { modules, labDates, bpFlagged, today } = input;
  const has = (m: CareModule) => modules.includes(m);
  const out = new Map<string, PreventiveSuggestion>();

  const lastNote = (t: LabType) => {
    const d = labDates[t];
    return d ? `Last recorded ${daysSince(d, today)} days ago.` : 'None on record yet.';
  };

  if (has('diabetes')) {
    if (overdue(labDates.HBA1C, 90, today)) {
      out.set('hba1c', {
        key: 'hba1c',
        title: 'HbA1c check',
        cadence: 'Every 3 months',
        citation: 'ADA Standards of Care in Diabetes',
        detail: `${lastNote('HBA1C')} An HbA1c is generally checked about every 3 months.`,
      });
    }
    out.set('eye-exam', {
      key: 'eye-exam',
      title: 'Diabetic eye exam',
      cadence: 'Yearly',
      citation: 'ADA Standards of Care in Diabetes',
      detail: 'An annual dilated eye exam is recommended when you have diabetes.',
    });
  }

  if ((has('diabetes') || has('ckd')) && overdue(labDates.EGFR, 365, today)) {
    out.set('kidney', {
      key: 'kidney',
      title: 'Kidney check (eGFR + urine albumin)',
      cadence: 'Yearly',
      citation: 'KDIGO / ADA',
      detail: `${lastNote('EGFR')} A yearly kidney check is recommended for diabetes or CKD.`,
    });
  }

  if ((has('diabetes') || has('dyslipidemia')) && overdue(labDates.LDL, 365, today)) {
    out.set('lipid', {
      key: 'lipid',
      title: 'Cholesterol (lipid panel)',
      cadence: 'Yearly',
      citation: 'ACC/AHA cholesterol guideline',
      detail: `${lastNote('LDL')} A periodic lipid panel is recommended.`,
    });
  }

  if (has('hypertension') && bpFlagged) {
    out.set('bp-recheck', {
      key: 'bp-recheck',
      title: 'Blood-pressure recheck',
      cadence: 'Within a few days',
      citation: 'ACC/AHA 2017 high blood pressure guideline',
      detail:
        'Your latest reading was outside the usual range — recheck when rested and contact your care team if it stays high.',
    });
  }

  return [...out.values()];
}
