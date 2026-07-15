/**
 * Medication adherence derived from daily check-ins. Pure (no DB) so it is unit
 * tested directly. Not a clinical measure — it reflects self-reported check-ins
 * only (docs/MEDICAL_SAFETY_RULES.md: never a diagnosis).
 */
export interface Adherence {
  /** Check-ins that recorded whether medication was taken. */
  loggedDays: number;
  /** Of those, how many reported medication taken. */
  takenDays: number;
  /** Percentage taken over logged days (0 when nothing logged). */
  rate: number;
  /** Consecutive most-recent check-ins reporting medication taken. */
  streak: number;
}

export function computeAdherence(
  checkIns: { date: Date; medicationTaken: boolean | null }[],
): Adherence {
  // `checkIns` is expected newest-first (listCheckIns orders by date desc).
  const logged = checkIns.filter((c) => c.medicationTaken !== null);
  const loggedDays = logged.length;
  const takenDays = logged.filter((c) => c.medicationTaken === true).length;
  const rate = loggedDays ? Math.round((takenDays / loggedDays) * 100) : 0;

  let streak = 0;
  for (const c of checkIns) {
    if (c.medicationTaken === true) streak += 1;
    else break;
  }
  return { loggedDays, takenDays, rate, streak };
}
