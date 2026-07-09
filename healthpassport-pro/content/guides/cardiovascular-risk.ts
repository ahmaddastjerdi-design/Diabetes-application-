import type { GuideArticle } from './types';

export const cardiovascularRisk: GuideArticle = {
  slug: 'cardiovascular-risk',
  topic: 'cardiovascular',
  title: 'Caring for your heart',
  summary:
    'How diabetes, blood pressure, cholesterol, and lifestyle together shape cardiovascular risk.',
  status: 'approved',
  sections: [
    {
      heading: 'Risk is a picture, not a single number',
      body: [
        'Cardiovascular risk comes from many factors together — blood pressure, cholesterol, glucose, smoking, activity, family history, and age.',
        'Your clinician estimates your overall risk to guide care with you; the app helps you gather the pieces for that conversation.',
      ],
    },
    {
      heading: 'What lowers risk',
      body: [
        'Not smoking, regular physical activity, a heart-healthy eating pattern, healthy sleep, and keeping blood pressure, glucose, and cholesterol in your target ranges.',
        'If your clinician has prescribed medication for your heart health, take it as directed and raise any concerns with them rather than stopping on your own.',
      ],
    },
  ],
  whenToSeekCare: [
    'Chest pain or pressure, pain spreading to the arm or jaw, sudden severe shortness of breath, or a cold sweat — call emergency services.',
    'Face drooping, arm weakness, or slurred speech (signs of stroke) — call emergency services immediately.',
  ],
  sources: ['ACC/AHA cardiovascular prevention guidance'],
  reviewedBy: 'Pending clinician sign-off',
  lastReviewed: '2026-07-09',
};
