import { describe, expect, it } from 'vitest';
import { reminderSchema } from '@/lib/validation/reminders';
import { computeAdherence } from '@/lib/reminders/adherence';
import { suggestPreventive } from '@/lib/reminders/preventive';

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

describe('suggestPreventive', () => {
  const today = new Date('2026-07-09');
  const keys = (r: { key: string }[]) => r.map((s) => s.key).sort();

  it('suggests nothing without relevant conditions', () => {
    expect(
      suggestPreventive({ modules: [], labDates: {}, bpFlag: null, today }),
    ).toEqual([]);
  });

  it('suggests HbA1c, eye exam, kidney and lipid for diabetes with no labs', () => {
    const r = suggestPreventive({
      modules: ['diabetes'],
      labDates: {},
      bpFlag: null,
      today,
    });
    expect(keys(r)).toEqual(['eye-exam', 'hba1c', 'kidney', 'lipid']);
    // every suggestion carries a citation
    expect(r.every((s) => s.citation.length > 0)).toBe(true);
  });

  it('drops HbA1c when it was recorded recently', () => {
    const recent = new Date('2026-06-29'); // 10 days ago
    const r = suggestPreventive({
      modules: ['diabetes'],
      labDates: { HBA1C: recent, EGFR: recent, LDL: recent },
      bpFlag: null,
      today,
    });
    const k = keys(r);
    expect(k).not.toContain('hba1c');
    expect(k).not.toContain('kidney');
    expect(k).not.toContain('lipid');
    expect(k).toContain('eye-exam'); // standing annual recommendation
  });

  it('suggests a BP recheck only when the latest reading is flagged', () => {
    const flagged = suggestPreventive({
      modules: ['hypertension'],
      labDates: {},
      bpFlag: 'high',
      today,
    });
    expect(keys(flagged)).toContain('bp-recheck');

    const ok = suggestPreventive({
      modules: ['hypertension'],
      labDates: {},
      bpFlag: null,
      today,
    });
    expect(keys(ok)).not.toContain('bp-recheck');
  });

  it('produces unique keys', () => {
    const r = suggestPreventive({
      modules: ['diabetes', 'ckd', 'dyslipidemia'],
      labDates: {},
      bpFlag: null,
      today,
    });
    expect(new Set(keys(r)).size).toBe(r.length);
  });

  it('phrases a low-BP recheck without telling the patient to watch for “high”', () => {
    const r = suggestPreventive({
      modules: ['hypertension'],
      labDates: {},
      bpFlag: 'low',
      today,
    });
    const bp = r.find((s) => s.key === 'bp-recheck');
    expect(bp).toBeTruthy();
    expect(bp!.detail.toLowerCase()).toContain('low');
    expect(bp!.detail.toLowerCase()).not.toContain('stays high');
  });
});
