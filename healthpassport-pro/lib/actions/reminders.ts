'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';
import { recordAudit } from '@/lib/audit/audit';
import {
  createReminder,
  getPreventiveSuggestions,
  setReminderActive,
  softDeleteReminder,
} from '@/lib/data/reminders';
import { reminderSchema, type ReminderInput } from '@/lib/validation/reminders';
import type { FormResult } from '@/lib/actions/profile';

function revalidate() {
  revalidatePath('/track/reminders');
  revalidatePath('/dashboard');
}

export async function addReminderAction(
  input: ReminderInput,
): Promise<FormResult> {
  const user = await requireUser();
  const parsed = reminderSchema.safeParse(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(flat)) if (v?.[0]) out[k] = v[0];
    return { fieldErrors: out };
  }
  const created = await createReminder(user.id, parsed.data);
  await recordAudit({
    userId: user.id,
    action: 'CREATE',
    entityType: 'Reminder',
    entityId: created.id,
  });
  revalidate();
  return { ok: true };
}

export async function toggleReminderAction(
  id: string,
  active: boolean,
): Promise<FormResult> {
  const user = await requireUser();
  const ok = await setReminderActive(user.id, id, active);
  if (!ok) return { error: 'Reminder not found.' };
  await recordAudit({
    userId: user.id,
    action: 'UPDATE',
    entityType: 'Reminder',
    entityId: id,
    metadata: { active },
  });
  revalidate();
  return { ok: true };
}

/**
 * Accept a smart preventive suggestion by key. The suggestion is re-derived
 * server-side (never trust the client for its title/citation), then saved as a
 * PREVENTIVE reminder tagged `[auto:<key>]` so it won't be suggested again.
 */
export async function acceptSuggestionAction(key: string): Promise<FormResult> {
  const user = await requireUser();
  const suggestion = (await getPreventiveSuggestions(user.id)).find(
    (s) => s.key === key,
  );
  if (!suggestion) {
    return { error: 'That suggestion is no longer applicable.' };
  }
  const created = await createReminder(user.id, {
    type: 'PREVENTIVE',
    label: suggestion.title,
    schedule: suggestion.cadence,
    notes: `[auto:${suggestion.key}] ${suggestion.detail}`,
  });
  await recordAudit({
    userId: user.id,
    action: 'CREATE',
    entityType: 'Reminder',
    entityId: created.id,
    metadata: { preventive: suggestion.key },
  });
  revalidate();
  return { ok: true };
}

export async function deleteReminderAction(id: string): Promise<FormResult> {
  const user = await requireUser();
  const ok = await softDeleteReminder(user.id, id);
  if (!ok) return { error: 'Reminder not found.' };
  await recordAudit({
    userId: user.id,
    action: 'DELETE',
    entityType: 'Reminder',
    entityId: id,
  });
  revalidate();
  return { ok: true };
}
