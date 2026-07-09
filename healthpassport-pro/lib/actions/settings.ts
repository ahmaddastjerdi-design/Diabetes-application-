'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';
import { recordAudit } from '@/lib/audit/audit';
import { updateSettings } from '@/lib/data/settings';
import { settingsSchema, type SettingsInput } from '@/lib/validation/settings';
import type { FormResult } from '@/lib/actions/profile';

export async function saveSettingsAction(
  input: SettingsInput,
): Promise<FormResult> {
  const user = await requireUser();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(flat)) if (v?.[0]) out[k] = v[0];
    return { fieldErrors: out };
  }
  await updateSettings(user.id, parsed.data);
  await recordAudit({
    userId: user.id,
    action: 'UPDATE',
    entityType: 'UserSettings',
  });
  revalidatePath('/settings');
  revalidatePath('/privacy-security');
  return { ok: true };
}
