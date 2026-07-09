'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/session';
import { recordAudit } from '@/lib/audit/audit';
import {
  addEmergencyContact,
  completeOnboarding,
  removeEmergencyContact,
  setOfflineSummaryConsent,
  updateProfile,
} from '@/lib/data/profile';
import {
  emergencyContactSchema,
  profileSchema,
  type EmergencyContactInput,
  type ProfileInput,
} from '@/lib/validation/profile';

export interface FormResult {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

function toFieldErrors(
  flat: Record<string, string[] | undefined>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(flat)) if (v?.[0]) out[k] = v[0];
  return out;
}

export async function saveProfileAction(
  input: ProfileInput,
): Promise<FormResult> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error.flatten().fieldErrors) };
  }
  await updateProfile(user.id, parsed.data);
  await recordAudit({
    userId: user.id,
    action: 'UPDATE',
    entityType: 'PatientProfile',
  });
  revalidatePath('/profile');
  return { ok: true };
}

export async function addEmergencyContactAction(
  input: EmergencyContactInput,
): Promise<FormResult> {
  const user = await requireUser();
  const parsed = emergencyContactSchema.safeParse(input);
  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error.flatten().fieldErrors) };
  }
  const created = await addEmergencyContact(user.id, parsed.data);
  await recordAudit({
    userId: user.id,
    action: 'CREATE',
    entityType: 'EmergencyContact',
    entityId: created.id,
  });
  revalidatePath('/profile');
  return { ok: true };
}

export async function removeEmergencyContactAction(
  id: string,
): Promise<FormResult> {
  const user = await requireUser();
  const removed = await removeEmergencyContact(user.id, id);
  if (!removed) return { error: 'Not found.' };
  await recordAudit({
    userId: user.id,
    action: 'DELETE',
    entityType: 'EmergencyContact',
    entityId: id,
  });
  revalidatePath('/profile');
  return { ok: true };
}

export async function setOfflineConsentAction(
  granted: boolean,
): Promise<FormResult> {
  const user = await requireUser();
  await setOfflineSummaryConsent(user.id, granted);
  await recordAudit({
    userId: user.id,
    action: 'CONSENT_CHANGE',
    entityType: 'Consent',
    metadata: { type: 'OFFLINE_SUMMARY', granted },
  });
  revalidatePath('/privacy-security');
  return { ok: true };
}

/**
 * Save the onboarding profile + optional first emergency contact, then mark
 * onboarding complete and go to the dashboard.
 */
export async function finishOnboardingAction(input: {
  profile: ProfileInput;
  contact?: EmergencyContactInput;
}): Promise<FormResult> {
  const user = await requireUser();

  const profile = profileSchema.safeParse(input.profile);
  if (!profile.success) {
    return { fieldErrors: toFieldErrors(profile.error.flatten().fieldErrors) };
  }
  await updateProfile(user.id, profile.data);

  if (input.contact && input.contact.name) {
    const contact = emergencyContactSchema.safeParse(input.contact);
    if (!contact.success) {
      return {
        fieldErrors: toFieldErrors(contact.error.flatten().fieldErrors),
      };
    }
    await addEmergencyContact(user.id, contact.data);
  }

  await completeOnboarding(user.id);
  await recordAudit({
    userId: user.id,
    action: 'UPDATE',
    entityType: 'PatientProfile',
    metadata: { event: 'onboarding_complete' },
  });
  redirect('/dashboard');
}
