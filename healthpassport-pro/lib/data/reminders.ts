import { prisma } from '@/lib/db/prisma';
import { listCheckIns } from '@/lib/data/tracking';
import { computeAdherence } from '@/lib/reminders/adherence';
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
