import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Terms of Use' };

export default function TermsPage() {
  return (
    <article className="container max-w-2xl space-y-4 py-12 text-muted-foreground">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Terms of Use
      </h1>
      <p className="text-sm">Draft — pending legal review.</p>

      <h2 className="pt-4 text-xl font-semibold text-foreground">1. The service</h2>
      <p>
        HealthPassport Pro is a personal health record and educational chronic-care
        guide for your own use. By creating an account you agree to these terms.
      </p>

      <h2 className="pt-4 text-xl font-semibold text-foreground">
        2. Not medical advice
      </h2>
      <p>
        The service does not diagnose, prescribe, or replace your physician. See our{' '}
        <Link href="/medical-disclaimer" className="text-primary underline">
          Medical Disclaimer
        </Link>
        . You are responsible for following your own clinician&apos;s advice.
      </p>

      <h2 className="pt-4 text-xl font-semibold text-foreground">
        3. Your account
      </h2>
      <p>
        Keep your credentials secure. You are responsible for activity under your
        account. Provide accurate information.
      </p>

      <h2 className="pt-4 text-xl font-semibold text-foreground">
        4. Acceptable use
      </h2>
      <p>
        Use the service only for your own personal health record. Do not attempt to
        access other users&apos; data or disrupt the service.
      </p>

      <h2 className="pt-4 text-xl font-semibold text-foreground">
        5. Privacy
      </h2>
      <p>
        Your data is handled per our{' '}
        <Link href="/privacy" className="text-primary underline">
          Privacy Policy
        </Link>
        .
      </p>
    </article>
  );
}
