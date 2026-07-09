import { describe, expect, it } from 'vitest';
import { reminderSchema } from '@/lib/validation/reminders';
import { computeAdherence } from '@/lib/reminders/adherence';

describe('reminderSchema', () => {
  it('accepts a valid medication reminder', () => {
    const r = reminderSchema.safeParse({
      type: 'MEDICATION',
      label: 'Take Metformin 500 mg',
      schedule: '8:00 AM & 8:00 PM daily',
    });
    expect(r.success).toBe(true);
  });

  it('defaults the type to MEDICATION', () => {
    const r = reminderSchema.safeParse({ label: 'BP check', schedule: 'Mondays' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.type).toBe('MEDICATION');
  });

  it('requires a label and a schedule', () => {
    expect(reminderSchema.safeParse({ label: '', schedule: 'daily' }).success).toBe(false);
    expect(reminderSchema.safeParse({ label: 'x', schedule: '' }).success).toBe(false);
  });

  it('rejects an unknown type', () => {
    expect(
      reminderSchema.safeParse({ type: 'SNOOZE', label: 'x', schedule: 'y' }).success,
    ).toBe(false);
  });
});

describe('computeAdherence', () => {
  const d = (s: string) => new Date(s);

  it('is zero when nothing is logged', () => {
    const a = computeAdherence([]);
    expect(a).toEqual({ loggedDays: 0, takenDays: 0, rate: 0, streak: 0 });
  });

  it('ignores days where medication was not recorded', () => {
    const a = computeAdherence([
      { date: d('2026-07-09'), medicationTaken: true },
      { date: d('2026-07-08'), medicationTaken: null },
      { date: d('2026-07-07'), medicationTaken: false },
    ]);
    expect(a.loggedDays).toBe(2); // the null day is excluded
    expect(a.takenDays).toBe(1);
    expect(a.rate).toBe(50);
  });

  it('counts the current streak from the newest check-in', () => {
    const a = computeAdherence([
      { date: d('2026-07-09'), medicationTaken: true },
      { date: d('2026-07-08'), medicationTaken: true },
      { date: d('2026-07-07'), medicationTaken: false },
      { date: d('2026-07-06'), medicationTaken: true },
    ]);
    expect(a.streak).toBe(2);
    expect(a.rate).toBe(75); // 3 of 4 taken
  });

  it('breaks the streak immediately if the newest day was missed', () => {
    const a = computeAdherence([
      { date: d('2026-07-09'), medicationTaken: false },
      { date: d('2026-07-08'), medicationTaken: true },
    ]);
    expect(a.streak).toBe(0);
  });
});
