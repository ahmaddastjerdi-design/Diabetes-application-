import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Siren } from 'lucide-react';
import { requireUser } from '@/lib/auth/session';
import { getApprovedGuides, getGuide } from '@/lib/content/guides';
import { formatDate } from '@/lib/utils/format';
import { PageHeader } from '@/components/layout/page-header';
import { MedicalDisclaimer } from '@/components/safety/medical-disclaimer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Params {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getApprovedGuides().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  return { title: guide?.title ?? 'Guide' };
}

export default async function GuideDetailPage({ params }: Params) {
  await requireUser();
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  return (
    <>
      <Link
        href="/guide"
        className="mb-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <ArrowLeft aria-hidden className="size-4" /> All guides
      </Link>
      <PageHeader title={guide.title} description={guide.summary} />

      <div className="space-y-6">
        {/* Red-flag guidance first and prominent. */}
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Siren aria-hidden className="size-5" /> When to seek care
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1.5 pl-5 text-sm">
              {guide.whenToSeekCare.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {guide.sections.map((section) => (
          <Card key={section.heading}>
            <CardHeader>
              <CardTitle>{section.heading}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              {section.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </CardContent>
          </Card>
        ))}

        <div className="rounded-md border p-4 text-xs text-muted-foreground">
          <p>
            <span className="font-medium">Sources:</span> {guide.sources.join('; ')}
          </p>
          <p className="mt-1">
            Reviewed: {guide.reviewedBy} · Last updated {formatDate(new Date(guide.lastReviewed))}
          </p>
        </div>

        <MedicalDisclaimer />
      </div>
    </>
  );
}
