import Link from 'next/link';
import {
  Activity,
  FileText,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const FEATURES = [
  {
    icon: Activity,
    title: 'Track what matters',
    body: 'Log vitals, labs, symptoms, medications, and daily check-ins in one calm place.',
  },
  {
    icon: TrendingUp,
    title: 'Understand your trends',
    body: 'See your numbers over time against clear, cited reference ranges — never a diagnosis.',
  },
  {
    icon: ShieldCheck,
    title: 'Red-flag awareness',
    body: 'Recognizes urgent patterns and guides you to seek the right level of care.',
  },
  {
    icon: FileText,
    title: 'Physician-ready reports',
    body: 'Generate a clear summary to share and discuss at your next appointment.',
  },
  {
    icon: WifiOff,
    title: 'Works offline',
    body: 'Install it like an app; view your latest health summary even without a connection.',
  },
  {
    icon: Stethoscope,
    title: 'Chronic-care guides',
    body: 'Reviewed, evidence-based education for diabetes, blood pressure, kidney and heart health.',
  },
];

export default function LandingPage() {
  return (
    <>
      <section className="container py-16 text-center md:py-24">
        <p className="mb-4 inline-flex rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
          Your health record, in your pocket
        </p>
        <h1 className="mx-auto max-w-3xl text-balance text-4xl font-bold tracking-tight md:text-5xl">
          Own your health record. Manage chronic conditions with confidence.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
          HealthPassport Pro is a private, secure personal health record and
          educational chronic-care guide — built to help you track, understand,
          and prepare for every appointment.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/register">Create your free account</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/medical-disclaimer">How it keeps you safe</Link>
          </Button>
        </div>
      </section>

      <section className="container pb-20">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <li key={f.title}>
              <Card className="h-full">
                <CardHeader>
                  <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <f.icon aria-hidden className="size-5" />
                  </span>
                  <CardTitle>{f.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {f.body}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
