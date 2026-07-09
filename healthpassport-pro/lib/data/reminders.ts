import type { LabType } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { listCheckIns, listLabs } from '@/lib/data/tracking';
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
const DAY = 86_400_000;

/** Direction of a flagged latest blood-pressure reading (or null if in range). */
async function latestBpFlag(
  userId: string,
): Promise<import('@/lib/reminders/preventive').BpFlag> {
  const latest = await prisma.vitalObservation.findFirst({
    where: { userId, type: 'BLOOD_PRESSURE', deletedAt: null },
    orderBy: { recordedAt: 'desc' },
  });
  // Skip when systolic wasn't recorded — a null must not default to 0 and trip
  // the hypotension branch.
  if (!latest || latest.valueNumeric == null) return null;
  const ev = evaluateVital(
    'BLOOD_PRESSURE',
    latest.valueNumeric,
    latest.unit,
    latest.valueSecondary ?? undefined,
  );
  if (ev.disposition === 'ROUTINE') return null;
  return ev.findings.some((f) => f.code === 'hypotension') ? 'low' : 'high';
}

/**
 * Smart preventive-care suggestions derived from the patient's conditions and
 * how recently things were measured. A suggestion the patient already added is
 * hidden only until its cadence elapses, so e.g. a yearly eye-exam nudge
 * re-surfaces after a year rather than disappearing forever.
 */
export async function getPreventiveSuggestions(userId: string) {
  const today = new Date();
  const [conditions, labs, reminders, bpFlag] = await Promise.all([
    listConditions(userId),
    listLabs(userId),
    listReminders(userId),
    latestBpFlag(userId),
  ]);

  const modules = careModulesFromConditions(
    conditions.map((c) => ({ code: c.code })),
  );

  // Labs are newest-first, so the first occurrence of each type is the latest.
  const labDates: Partial<Record<LabType, Date>> = {};
  for (const l of labs) if (!labDates[l.type]) labDates[l.type] = l.recordedAt;

  // Most recent time each auto-suggestion was accepted (from its reminder).
  const acceptedAt = new Map<string, Date>();
  for (const r of reminders) {
    const m = r.notes?.match(AUTO_KEY);
    if (!m) continue;
    const prev = acceptedAt.get(m[1]!);
    if (!prev || r.createdAt > prev) acceptedAt.set(m[1]!, r.createdAt);
  }

  return suggestPreventive({ modules, labDates, bpFlag, today }).filter((s) => {
    const at = acceptedAt.get(s.key);
    return !at || (today.getTime() - at.getTime()) / DAY > s.cadenceDays;
  });
}
