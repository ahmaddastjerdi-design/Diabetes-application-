import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, ChevronRight, Sparkles } from 'lucide-react';
import { requireUser } from '@/lib/auth/session';
import { listConditions } from '@/lib/data/records';
import { careModulesFromConditions } from '@/lib/clinical/conditions';
import { getApprovedGuides, recommendedGuides } from '@/lib/content/guides';
import { PageHeader } from '@/components/layout/page-header';
import { MedicalDisclaimer } from '@/components/safety/medical-disclaimer';
import { Card, CardContent } from '@/components/ui/card';
import type { GuideArticle } from '@/content/guides/types';

export const metadata: Metadata = { title: 'Chronic-care guide' };

function GuideCard({ guide }: { guide: GuideArticle }) {
  return (
    <Link href={`/guide/${guide.slug}`} className="block focus-visible:outline-none">
      <Card className="transition-colors hover:border-primary">
        <CardContent className="flex items-center gap-3 py-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
            <BookOpen aria-hidden className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium">{guide.title}</span>
            <span className="block text-sm text-muted-foreground">{guide.summary}</span>
          </span>
          <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function GuidePage() {
  const user = await requireUser();
  const conditions = await listConditions(user.id);
  const modules = careModulesFromConditions(conditions.map((c) => ({ code: c.code })));
  const recommended = recommendedGuides(modules);
  const recommendedSlugs = new Set(recommended.map((g) => g.slug));
  const others = getApprovedGuides().filter((g) => !recommendedSlugs.has(g.slug));

  return (
    <>
      <PageHeader
        title="Chronic-care guide"
        description="Reviewed, evidence-based education. Always follow your own care team."
      />
      <div className="space-y-6">
        <MedicalDisclaimer variant="compact" />

        {recommended.length > 0 && (
          <section aria-labelledby="recommended">
            <h2 id="recommended" className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <Sparkles aria-hidden className="size-5 text-primary" />
              Recommended for you
            </h2>
            <div className="space-y-3">
              {recommended.map((g) => (
                <GuideCard key={g.slug} guide={g} />
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="all-guides">
          <h2 id="all-guides" className="mb-3 text-lg font-semibold">
            {recommended.length > 0 ? 'More guides' : 'All guides'}
          </h2>
          <div className="space-y-3">
            {others.map((g) => (
              <GuideCard key={g.slug} guide={g} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
