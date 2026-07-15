import type { GuideArticle } from './types';

export const hypertension: GuideArticle = {
  slug: 'hypertension',
  topic: 'hypertension',
  careModule: 'hypertension',
  title: 'Understanding blood pressure',
  summary:
    'How to measure blood pressure at home, what the numbers mean, and when a reading needs attention.',
  status: 'approved',
  sections: [
    {
      heading: 'Measuring accurately at home',
      body: [
        'Sit quietly for a few minutes first, back supported and feet flat on the floor, with the cuff on a bare arm at heart level.',
        'Avoid caffeine, exercise, and smoking for 30 minutes beforehand, and empty your bladder.',
        'Take two readings a minute apart at consistent times, and record them here. Trends over days matter more than any single number.',
      ],
    },
    {
      heading: 'What the numbers mean',
      body: [
        'Blood pressure is written as systolic over diastolic (for example 120/80 mmHg).',
        'Under many guidelines, less than 120/80 is considered normal; 130/80 or above is often labeled elevated or high. Diagnostic thresholds vary between guidelines, so your clinician interprets your readings in context.',
        'Your personal target is set with your care team. These ranges are general guidance, not a diagnosis.',
      ],
    },
    {
      heading: 'Habits that support healthy blood pressure',
      body: [
        'Reducing salt, staying active, limiting alcohol, managing stress, and maintaining a healthy weight can all help.',
        'Take medications as prescribed; if you have concerns or side effects, discuss them with your clinician rather than stopping on your own.',
      ],
    },
  ],
  whenToSeekCare: [
    'A reading of 180/120 mmHg or higher — rest and recheck; if it stays this high or you feel unwell, seek care now.',
    'Very high blood pressure together with chest pain, severe headache, shortness of breath, vision changes, or weakness — seek emergency care.',
  ],
  sources: ['ACC/AHA 2017 High Blood Pressure Guideline', 'ESC/ESH guidance'],
  reviewedBy: 'Pending clinician sign-off',
  lastReviewed: '2026-07-09',
};
