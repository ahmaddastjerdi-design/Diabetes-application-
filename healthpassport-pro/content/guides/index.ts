import type { GuideArticle } from './types';
import { diabetes } from './diabetes';
import { hypertension } from './hypertension';
import { kidneyHealth } from './kidney-health';
import { cardiovascularRisk } from './cardiovascular-risk';
import { dyslipidemia } from './dyslipidemia';
import { obesity } from './obesity';
import { adherence } from './adherence';

export const ALL_GUIDES: GuideArticle[] = [
  diabetes,
  hypertension,
  kidneyHealth,
  cardiovascularRisk,
  dyslipidemia,
  obesity,
  adherence,
];

export type { GuideArticle } from './types';
