/**
 * Chronic-care guide content. Governed per docs/MEDICAL_SAFETY_RULES.md §4/§5:
 * every article carries a source, reviewer, and last-reviewed date; only
 * `status: 'approved'` articles are shown in production. Content is general
 * education — it never instructs medication changes and always defers to the
 * patient's care team.
 */
export type GuideTopic =
  | 'diabetes'
  | 'hypertension'
  | 'kidney'
  | 'cardiovascular'
  | 'dyslipidemia'
  | 'obesity'
  | 'adherence';

/** Links a guide to the chronic-care condition it supports (for personalization). */
export type CareModule =
  | 'diabetes'
  | 'hypertension'
  | 'ckd'
  | 'dyslipidemia'
  | 'obesity';

export interface GuideSection {
  heading: string;
  body: string[];
}

export interface GuideArticle {
  slug: string;
  topic: GuideTopic;
  careModule?: CareModule;
  title: string;
  summary: string;
  status: 'draft' | 'approved';
  sections: GuideSection[];
  /** Red-flag guidance shown prominently ("when to seek care"). */
  whenToSeekCare: string[];
  sources: string[];
  reviewedBy: string;
  lastReviewed: string; // ISO date
}
