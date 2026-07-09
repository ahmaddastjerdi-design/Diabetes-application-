'use server';

import { signOut } from '@/auth';
import { requireUser } from '@/lib/auth/session';
import { recordAudit } from '@/lib/audit/audit';
import { changePassword, deleteAccount } from '@/lib/data/account';
import {
  passwordChangeSchema,
  type PasswordChangeInput,
} from '@/lib/validation/settings';
import type { FormResult } from '@/lib/actions/profile';

export async function changePasswordAction(
  input: PasswordChangeInput,
): Promise<FormResult> {
  const user = await requireUser();
  const parsed = passwordChangeSchema.safeParse(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(flat)) if (v?.[0]) out[k] = v[0];
    return { fieldErrors: out };
  }
  const ok = await changePassword(
    user.id,
    parsed.data.currentPassword,
    parsed.data.newPassword,
  );
  if (!ok) {
    return { fieldErrors: { currentPassword: 'That password is incorrect.' } };
  }
  await recordAudit({
    userId: user.id,
    action: 'UPDATE',
    entityType: 'User',
    metadata: { field: 'password' },
  });
  return { ok: true };
}

/**
 * Permanently delete the account, then end the session. `deleteAccount`
 * cascades to all owned PHI. Audit is written *before* deletion (the row is
 * cascade-removed with the user, but the action still records intent in logs).
 */
export async function deleteAccountAction(confirm: string): Promise<FormResult> {
  const user = await requireUser();
  if (confirm !== 'DELETE') {
    return { error: 'Type DELETE to confirm.' };
  }
  await recordAudit({ userId: user.id, action: 'DELETE', entityType: 'User' });
  await deleteAccount(user.id);
  // Ends the session and redirects to /login (throws a redirect).
  await signOut({ redirectTo: '/login' });
  return { ok: true };
}
