import type { GuideArticle } from './types';

export const obesity: GuideArticle = {
  slug: 'obesity',
  topic: 'obesity',
  careModule: 'obesity',
  title: 'Weight and metabolic health',
  summary:
    'How weight, waist size, and metabolic markers connect — with a compassionate, non-judgmental approach.',
  status: 'approved',
  sections: [
    {
      heading: 'More than a number on the scale',
      body: [
        'Weight is one part of metabolic health, alongside blood pressure, glucose, cholesterol, and waist size.',
        'BMI and waist measurements are general screening tools; they do not tell the whole story for any individual, and thresholds can differ by population.',
        'Small, sustainable changes tend to help more than drastic ones. Be kind to yourself — this is a long-term journey.',
      ],
    },
    {
      heading: 'Supportive habits',
      body: [
        'Regular movement you enjoy, balanced meals, good sleep, and stress management all support metabolic health.',
        'If you are considering a weight-management medication or program, discuss the options with your clinician so the plan fits your health.',
      ],
    },
  ],
  whenToSeekCare: [
    'Rapid unintentional weight loss or gain, or new severe symptoms, are worth discussing promptly with your care team.',
  ],
  sources: ['WHO obesity classification', 'NCEP ATP III metabolic syndrome criteria'],
  reviewedBy: 'Pending clinician sign-off',
  lastReviewed: '2026-07-09',
};
