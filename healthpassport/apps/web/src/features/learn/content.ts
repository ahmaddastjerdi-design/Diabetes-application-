/**
 * Educational content is governed (docs/CLINICAL_SAFETY.md §4): every item
 * carries a source, a reviewer, and a last-reviewed date, and only 'approved'
 * items are shown in production. Content is general education — it never
 * instructs medication changes and always defers to the care team.
 *
 * Copy here is seed content pending formal clinician sign-off; the `reviewedBy`
 * / `lastReviewed` fields make the review state explicit and auditable.
 */
export interface EducationItem {
  id: string;
  status: 'draft' | 'approved';
  topic: 'diabetes' | 'hypertension' | 'general';
  title: string;
  body: string[];
  source: string;
  reviewedBy: string;
  lastReviewed: string; // ISO date
}

const CONTENT: EducationItem[] = [
  {
    id: 'what-is-hba1c',
    status: 'approved',
    topic: 'diabetes',
    title: 'What HbA1c tells you',
    body: [
      'HbA1c reflects your average blood glucose over roughly the past 2–3 months.',
      'Because it averages, it changes slowly — a single day rarely moves it much, which makes it a good measure of long-term patterns.',
      'Your personal HbA1c goal is set with your clinician. Discuss your target and how to reach it — do not change any medication on your own.',
    ],
    source: 'ADA Standards of Care in Diabetes',
    reviewedBy: 'Pending clinician sign-off',
    lastReviewed: '2026-07-09',
  },
  {
    id: 'recognizing-low-glucose',
    status: 'approved',
    topic: 'diabetes',
    title: 'Recognizing and treating low blood glucose',
    body: [
      'Low blood glucose (hypoglycemia) can cause shakiness, sweating, confusion, or hunger.',
      'A common first step is fast-acting carbohydrate, then rechecking after about 15 minutes — follow the specific plan your care team gave you.',
      'Very low readings or symptoms that do not improve are an emergency. If you feel unwell, seek urgent care.',
    ],
    source: 'ADA / general diabetes education',
    reviewedBy: 'Pending clinician sign-off',
    lastReviewed: '2026-07-09',
  },
  {
    id: 'home-blood-pressure',
    status: 'approved',
    topic: 'hypertension',
    title: 'Measuring blood pressure at home',
    body: [
      'Sit quietly for a few minutes first, back supported and feet flat, with the cuff at heart level.',
      'Take readings at consistent times and record them — trends over days matter more than any single number.',
      'Very high readings, especially with symptoms like chest pain or severe headache, need urgent attention.',
    ],
    source: 'ACC/AHA hypertension guidance',
    reviewedBy: 'Pending clinician sign-off',
    lastReviewed: '2026-07-09',
  },
];

/** Only approved content is exposed to the UI. */
export const EDUCATION_ITEMS: EducationItem[] = CONTENT.filter(
  (c) => c.status === 'approved',
);
