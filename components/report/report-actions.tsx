'use client';

import { useState } from 'react';
import { Check, Copy, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ReportActions({ summaryText }: { summaryText: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — user can still print/download */
    }
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button onClick={() => window.print()}>
        <Printer aria-hidden /> Print / Save PDF
      </Button>
      <Button variant="secondary" onClick={copy}>
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
        {copied ? 'Copied' : 'Copy summary'}
      </Button>
      <Button variant="outline" asChild>
        <a href="/api/export?format=fhir" download>
          <Download aria-hidden /> FHIR bundle
        </a>
      </Button>
      <Button variant="outline" asChild>
        <a href="/api/export?format=summary" download>
          <Download aria-hidden /> JSON summary
        </a>
      </Button>
    </div>
  );
}
