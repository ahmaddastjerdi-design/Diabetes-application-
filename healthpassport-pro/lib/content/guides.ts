import { ALL_GUIDES } from '@/content/guides';
import type { GuideArticle, CareModule } from '@/content/guides/types';

/** Only approved articles are shown in production (content governance). */
export function getApprovedGuides(): GuideArticle[] {
  return ALL_GUIDES.filter((g) => g.status === 'approved');
}

export function getGuide(slug: string): GuideArticle | undefined {
  return getApprovedGuides().find((g) => g.slug === slug);
}

/** Guides whose care module matches the patient's active conditions. */
export function recommendedGuides(modules: readonly CareModule[]): GuideArticle[] {
  if (modules.length === 0) return [];
  const set = new Set(modules);
  return getApprovedGuides().filter((g) => g.careModule && set.has(g.careModule));
}
