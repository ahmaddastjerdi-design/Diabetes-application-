import type { GuideArticle } from './types';

export const diabetes: GuideArticle = {
  slug: 'diabetes',
  topic: 'diabetes',
  careModule: 'diabetes',
  title: 'Living well with type 2 diabetes',
  summary:
    'How blood glucose, HbA1c, and daily habits fit together — and how to prepare for your appointments.',
  status: 'approved',
  sections: [
    {
      heading: 'What your numbers mean',
      body: [
        'Blood glucose is your level at a moment in time; it naturally rises after meals and falls with activity and medication.',
        'HbA1c reflects your average glucose over roughly the past 2–3 months, so it changes slowly and shows your longer-term pattern.',
        'Your personal targets are set with your clinician. Common general targets are an HbA1c under 7% and pre-meal glucose of about 80–130 mg/dL, but your own goal may differ.',
      ],
    },
    {
      heading: 'Everyday habits that help',
      body: [
        'Regular physical activity, balanced meals, adequate sleep, and not smoking all support glucose control.',
        'Checking glucose as your care team advised — and recording it here — helps you and your clinician see what is working.',
        'Take medications as prescribed. If you have side effects or questions, talk to your clinician or pharmacist — do not stop or change a dose on your own.',
      ],
    },
    {
      heading: 'Recognizing low and high glucose',
      body: [
        'Low glucose (hypoglycemia) can cause shakiness, sweating, hunger, or confusion. Follow the specific treatment plan your care team gave you.',
        'Very high glucose with symptoms like nausea, vomiting, and deep rapid breathing can be serious and needs prompt attention.',
      ],
    },
  ],
  whenToSeekCare: [
    'Very low glucose (for example under 54 mg/dL / 3.0 mmol/L) or symptoms that do not improve after treating it.',
    'Very high glucose (for example 400 mg/dL or higher), especially with nausea, vomiting, or trouble breathing.',
    'Any emergency symptoms such as chest pain, fainting, or confusion — seek emergency care.',
  ],
  sources: [
    'American Diabetes Association — Standards of Care in Diabetes',
  ],
  reviewedBy: 'Pending clinician sign-off',
  lastReviewed: '2026-07-09',
};
