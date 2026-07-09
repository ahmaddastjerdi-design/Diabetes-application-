import type { GuideArticle } from './types';

export const adherence: GuideArticle = {
  slug: 'adherence',
  topic: 'adherence',
  title: 'Getting the most from your medications',
  summary: 'Practical ways to remember medications and to work with your care team on any concerns.',
  status: 'approved',
  sections: [
    {
      heading: 'Why consistency matters',
      body: [
        'Many medications for chronic conditions work best when taken regularly, because they keep levels steady over time.',
        'Recording your medications here — and using reminders — can make a real difference to staying on track.',
      ],
    },
    {
      heading: 'Practical tips',
      body: [
        'Link taking your medication to an existing daily habit, such as brushing your teeth.',
        'Use a pill organizer or reminders, and keep an up-to-date list to share at appointments and in emergencies.',
        'If cost, side effects, or a complex schedule make it hard to keep up, tell your clinician or pharmacist — there are often solutions. Never stop or change a medication on your own.',
      ],
    },
  ],
  whenToSeekCare: [
    'A serious reaction after a medication — such as difficulty breathing, swelling of the face or throat, or a widespread rash — is an emergency.',
    'If you accidentally take much more than prescribed, contact your local poison control or emergency services.',
  ],
  sources: ['WHO — Adherence to long-term therapies'],
  reviewedBy: 'Pending clinician sign-off',
  lastReviewed: '2026-07-09',
};
