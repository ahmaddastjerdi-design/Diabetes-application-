import type { Metadata } from 'next';
import { GLOBAL_DISCLAIMER } from '@/lib/medical-rules/disclaimer';

export const metadata: Metadata = { title: 'Medical Disclaimer' };

export default function MedicalDisclaimerPage() {
  return (
    <article className="container max-w-2xl py-12">
      <h1 className="text-3xl font-bold tracking-tight">Medical Disclaimer</h1>
      <div className="mt-6 rounded-lg border-l-4 border-primary bg-accent/50 p-5 text-lg">
        {GLOBAL_DISCLAIMER}
      </div>
      <div className="mt-8 space-y-4 text-muted-foreground">
        <h2 className="text-xl font-semibold text-foreground">What this app does</h2>
        <p>
          HealthPassport Pro helps you keep your health information in one place,
          understand your trends over time against general reference ranges, learn
          from reviewed educational content, recognize warning signs, and prepare a
          summary to discuss with your clinician.
        </p>
        <h2 className="text-xl font-semibold text-foreground">
          What this app does not do
        </h2>
        <p>
          It does not diagnose conditions, prescribe treatment, or tell you to
          start, stop, or change any medication. It is not a substitute for
          professional medical judgment. Always follow the advice of your own
          physician and care team.
        </p>
        <h2 className="text-xl font-semibold text-foreground">In an emergency</h2>
        <p>
          For urgent symptoms such as chest pain, severe shortness of breath,
          fainting, stroke-like symptoms (face drooping, arm weakness, slurred
          speech), or severe weakness, seek emergency medical care immediately.
        </p>
      </div>
    </article>
  );
}
