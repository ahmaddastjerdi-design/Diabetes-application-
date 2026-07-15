import { describe, expect, it } from 'vitest';
import { getApprovedGuides, getGuide, recommendedGuides } from '@/lib/content/guides';

describe('guide content governance', () => {
  const guides = getApprovedGuides();

  it('exposes the seven chronic-care guides', () => {
    expect(guides.length).toBe(7);
  });

  it('every guide is approved, cited, and has red-flag guidance', () => {
    for (const g of guides) {
      expect(g.status).toBe('approved');
      expect(g.sources.length).toBeGreaterThan(0);
      expect(g.whenToSeekCare.length).toBeGreaterThan(0);
      expect(g.reviewedBy.length).toBeGreaterThan(0);
      expect(g.sections.length).toBeGreaterThan(0);
    }
  });

  it('resolves a guide by slug and personalizes by care module', () => {
    expect(getGuide('diabetes')?.title).toMatch(/diabetes/i);
    expect(getGuide('does-not-exist')).toBeUndefined();

    const recommended = recommendedGuides(['diabetes', 'hypertension']);
    const slugs = recommended.map((g) => g.slug);
    expect(slugs).toContain('diabetes');
    expect(slugs).toContain('hypertension');
    expect(recommendedGuides([])).toHaveLength(0);
  });
});
