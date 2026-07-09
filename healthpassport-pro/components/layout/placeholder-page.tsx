import { Construction } from 'lucide-react';
import { PageHeader } from './page-header';
import { Card, CardContent } from '@/components/ui/card';

/** Honest placeholder for a section whose full UI lands in a later phase. */
export function PlaceholderPage({
  title,
  description,
  phaseNote,
}: {
  title: string;
  description?: string;
  phaseNote: string;
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
          <Construction aria-hidden className="size-8 text-primary" />
          <p className="max-w-md">{phaseNote}</p>
        </CardContent>
      </Card>
    </>
  );
}
