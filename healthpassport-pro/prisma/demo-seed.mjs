// Synthetic demo seed — a fully onboarded patient with sample data so the app
// can be explored immediately. NEVER seeds real PHI (docs/PRIVACY_MODEL.md).
// Run only when explicitly requested (the container gates this behind
// SEED_DEMO=true). Idempotent: re-running refreshes the same demo account.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const EMAIL = 'demo@healthpassport.local';
const PASSWORD = 'Demo!12345';
const DAY = 86_400_000;

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { passwordHash, name: 'Alex Rivers' },
    create: { email: EMAIL, name: 'Alex Rivers', passwordHash, role: 'PATIENT' },
  });
  const uid = user.id;

  await prisma.patientProfile.upsert({
    where: { userId: uid },
    update: { onboardedAt: new Date('2026-05-01T10:00:00Z') },
    create: {
      userId: uid,
      givenName: 'Alex',
      familyName: 'Rivers',
      birthDate: new Date('1968-04-12'),
      sex: 'male',
      preferredLanguage: 'en',
      heightCm: 176,
      unitsSystem: 'METRIC',
      onboardedAt: new Date('2026-05-01T10:00:00Z'),
    },
  });
  await prisma.userSettings.upsert({
    where: { userId: uid },
    update: {},
    create: { userId: uid },
  });

  // Reset owned demo rows so re-running is clean.
  for (const model of [
    'condition',
    'medication',
    'vitalObservation',
    'labResult',
    'dailyCheckIn',
  ]) {
    await prisma[model].deleteMany({ where: { userId: uid } });
  }

  await prisma.condition.createMany({
    data: [
      { userId: uid, code: '59621000', icd10: 'I10', display: 'Essential hypertension', clinicalStatus: 'ACTIVE', onsetDate: new Date('2022-03-01') },
      { userId: uid, code: '44054006', icd10: 'E11', display: 'Type 2 diabetes mellitus', clinicalStatus: 'ACTIVE', onsetDate: new Date('2023-08-15') },
      { userId: uid, code: '55822004', icd10: 'E78.5', display: 'Hyperlipidemia', clinicalStatus: 'ACTIVE', onsetDate: new Date('2023-08-15') },
    ],
  });
  await prisma.medication.createMany({
    data: [
      { userId: uid, name: 'Metformin', rxnorm: '860975', dosageText: '500 mg, twice daily', status: 'ACTIVE', startDate: new Date('2023-08-20') },
      { userId: uid, name: 'Lisinopril', rxnorm: '314076', dosageText: '10 mg, once daily', status: 'ACTIVE', startDate: new Date('2022-03-05') },
      { userId: uid, name: 'Atorvastatin', rxnorm: '617312', dosageText: '20 mg, at night', status: 'ACTIVE', startDate: new Date('2023-08-20') },
    ],
  });

  // BP series ending on a flagged reading so the dashboard shows the red-flag
  // attention banner and a trend without any interaction.
  const bp = [[138, 86], [142, 88], [135, 84], [148, 90], [140, 86], [185, 125]];
  const base = Date.parse('2026-07-09T09:00:00Z');
  await prisma.vitalObservation.createMany({
    data: [
      ...bp.map(([s, d], i) => ({
        userId: uid,
        type: 'BLOOD_PRESSURE',
        valueNumeric: s,
        valueSecondary: d,
        unit: 'mmHg',
        recordedAt: new Date(base - (bp.length - 1 - i) * 3 * DAY),
      })),
      { userId: uid, type: 'GLUCOSE', valueNumeric: 132, unit: 'mg/dL', recordedAt: new Date('2026-07-08T08:00:00Z') },
      { userId: uid, type: 'GLUCOSE', valueNumeric: 128, unit: 'mg/dL', recordedAt: new Date('2026-07-05T08:00:00Z') },
      { userId: uid, type: 'WEIGHT', valueNumeric: 90.9, unit: 'kg', recordedAt: new Date('2026-07-08T08:00:00Z') },
      { userId: uid, type: 'HEART_RATE', valueNumeric: 78, unit: 'bpm', recordedAt: new Date('2026-07-08T08:00:00Z') },
    ],
  });
  await prisma.labResult.createMany({
    data: [
      { userId: uid, type: 'HBA1C', value: 7.2, unit: '%', recordedAt: new Date('2026-06-30T00:00:00Z') },
      { userId: uid, type: 'LDL', value: 118, unit: 'mg/dL', recordedAt: new Date('2026-06-30T00:00:00Z') },
      { userId: uid, type: 'EGFR', value: 68, unit: 'mL/min/1.73m²', recordedAt: new Date('2026-06-30T00:00:00Z') },
      { userId: uid, type: 'POTASSIUM', value: 4.4, unit: 'mmol/L', recordedAt: new Date('2026-06-30T00:00:00Z') },
    ],
  });
  await prisma.dailyCheckIn.create({
    data: { userId: uid, date: new Date('2026-07-09'), mood: 4, medicationTaken: true },
  });

  console.warn(`Demo patient ready — sign in with ${EMAIL} / ${PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
