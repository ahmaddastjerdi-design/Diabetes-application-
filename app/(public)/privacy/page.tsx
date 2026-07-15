import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <article className="container max-w-2xl space-y-4 py-12 text-muted-foreground">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Privacy Policy
      </h1>
      <p className="text-sm">
        Draft — pending legal review. Summary of how HealthPassport Pro handles
        your data. See the product&apos;s privacy model documentation for the full
        design.
      </p>

      <h2 className="pt-4 text-xl font-semibold text-foreground">You own your data</h2>
      <p>
        Your health information belongs to you. We act as a custodian to store and
        display it for your own care. We do not sell your data or use it for
        advertising.
      </p>

      <h2 className="pt-4 text-xl font-semibold text-foreground">
        What we collect and why
      </h2>
      <p>
        Only what a personal health record needs: your account details and the
        health information you choose to record. Each field exists to render your
        record, produce your reports, or power your care features — nothing more.
      </p>

      <h2 className="pt-4 text-xl font-semibold text-foreground">Your rights</h2>
      <p>
        You can view, correct, export, and permanently erase your data at any time
        from within the app. Consent is granular, versioned, and revocable.
      </p>

      <h2 className="pt-4 text-xl font-semibold text-foreground">Security</h2>
      <p>
        Access to your record is protected by authentication and strict
        server-side authorization, so only you can see your data. Sensitive actions
        are recorded in an audit log.
      </p>
    </article>
  );
}
