import type { LabType } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { listCheckIns, listLabs, listVitals } from '@/lib/data/tracking';
import { listConditions } from '@/lib/data/records';
import { careModulesFromConditions } from '@/lib/clinical/conditions';
import { evaluateVital } from '@/lib/medical-rules';
import { computeAdherence } from '@/lib/reminders/adherence';
import { suggestPreventive } from '@/lib/reminders/preventive';
import type { ReminderInput } from '@/lib/validation/reminders';

/** Active reminders first, then most recently created. Owner-scoped. */
export function listReminders(userId: string) {
  return prisma.reminder.findMany({
    where: { userId, deletedAt: null },
    orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
  });
}

export function createReminder(userId: string, input: ReminderInput) {
  return prisma.reminder.create({
    data: {
      userId,
      type: input.type,
      label: input.label,
      schedule: input.schedule,
      notes: input.notes ?? null,
    },
  });
}

/** Pause/resume. Ownership enforced via the scoped `updateMany`. */
export async function setReminderActive(
  userId: string,
  id: string,
  active: boolean,
): Promise<boolean> {
  const res = await prisma.reminder.updateMany({
    where: { id, userId, deletedAt: null },
    data: { active },
  });
  return res.count > 0;
}

export async function softDeleteReminder(
  userId: string,
  id: string,
): Promise<boolean> {
  const res = await prisma.reminder.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return res.count > 0;
}

/** Medication adherence over the last 30 daily check-ins. */
export async function getAdherence(userId: string) {
  const checkIns = await listCheckIns(userId, 30);
  return computeAdherence(checkIns);
}

const AUTO_KEY = /\[auto:([\w-]+)\]/;

/**
 * Smart preventive-care suggestions derived from the patient's conditions and
 * how recently things were measured, minus any the patient has already added as
 * a reminder (tagged `[auto:<key>]` in the reminder's notes).
 */
export async function getPreventiveSuggestions(userId: string) {
  const [conditions, labs, vitals, reminders] = await Promise.all([
    listConditions(userId),
    listLabs(userId),
    listVitals(userId, 50),
    listReminders(userId),
  ]);

  const modules = careModulesFromConditions(
    conditions.map((c) => ({ code: c.code })),
  );

  // Labs are newest-first, so the first occurrence of each type is the latest.
  const labDates: Partial<Record<LabType, Date>> = {};
  for (const l of labs) if (!labDates[l.type]) labDates[l.type] = l.recordedAt;

  const latestBp = vitals.find((v) => v.type === 'BLOOD_PRESSURE');
  const bpFlagged = latestBp
    ? evaluateVital(
        'BLOOD_PRESSURE',
        latestBp.valueNumeric ?? 0,
        latestBp.unit,
        latestBp.valueSecondary ?? undefined,
      ).disposition !== 'ROUTINE'
    : false;

  const accepted = new Set<string>();
  for (const r of reminders) {
    const m = r.notes?.match(AUTO_KEY);
    if (m) accepted.add(m[1]!);
  }

  return suggestPreventive({
    modules,
    labDates,
    bpFlagged,
    today: new Date(),
  }).filter((s) => !accepted.has(s.key));
}
