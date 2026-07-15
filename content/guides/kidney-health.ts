import type { GuideArticle } from './types';

export const kidneyHealth: GuideArticle = {
  slug: 'kidney-health',
  topic: 'kidney',
  careModule: 'ckd',
  title: 'Protecting your kidneys',
  summary:
    'What eGFR and urine albumin mean, and how diabetes and blood pressure affect kidney health.',
  status: 'approved',
  sections: [
    {
      heading: 'How kidney health is measured',
      body: [
        'eGFR estimates how well your kidneys filter; higher is generally better, and it is grouped into stages (G1 to G5).',
        'Urine albumin-to-creatinine ratio (UACR) checks for protein in the urine, an early sign of kidney stress, grouped as A1 to A3.',
        'These are tracked over time with your care team; single values are interpreted in context, not as a diagnosis.',
      ],
    },
    {
      heading: 'What helps protect your kidneys',
      body: [
        'Keeping blood glucose and blood pressure in your target ranges is one of the most important things for kidney health.',
        'Staying hydrated, following the eating plan your care team recommends, and attending regular check-ups all help.',
        'Some over-the-counter medicines (such as certain anti-inflammatory painkillers) can affect the kidneys — check with your clinician or pharmacist before regular use.',
      ],
    },
  ],
  whenToSeekCare: [
    'Symptoms such as marked swelling, very little urine, severe fatigue, or confusion — contact your care team promptly.',
    'A blood potassium result that is high (for example 6.0 mmol/L or above) needs urgent attention.',
  ],
  sources: ['KDIGO 2024 CKD Guideline'],
  reviewedBy: 'Pending clinician sign-off',
  lastReviewed: '2026-07-09',
};
