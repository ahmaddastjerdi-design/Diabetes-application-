import type { GuideArticle } from './types';

export const dyslipidemia: GuideArticle = {
  slug: 'dyslipidemia',
  topic: 'dyslipidemia',
  careModule: 'dyslipidemia',
  title: 'Understanding cholesterol',
  summary: 'What LDL, HDL, and triglycerides are, and how they fit your heart-health picture.',
  status: 'approved',
  sections: [
    {
      heading: 'The main lipid numbers',
      body: [
        'LDL cholesterol is often called "bad" cholesterol because higher levels are linked to higher cardiovascular risk.',
        'HDL is often called "good" cholesterol; triglycerides are another fat in the blood.',
        'Modern care sets cholesterol goals based on your overall cardiovascular risk, not a single universal number, so your clinician interprets your results for you.',
      ],
    },
    {
      heading: 'What can help',
      body: [
        'A heart-healthy eating pattern, regular activity, not smoking, and maintaining a healthy weight all support healthy lipids.',
        'If a cholesterol medication has been prescribed, take it as directed; discuss any side effects with your clinician or pharmacist instead of stopping it yourself.',
      ],
    },
  ],
  whenToSeekCare: [
    'Cholesterol itself is not an emergency, but the heart and stroke warning signs in the heart guide always are — seek emergency care for those.',
  ],
  sources: ['ACC/AHA blood cholesterol guidance', 'NCEP ATP III'],
  reviewedBy: 'Pending clinician sign-off',
  lastReviewed: '2026-07-09',
};
