import Link from 'next/link';
import { Brand } from '@/components/layout/brand';
import { Button } from '@/components/ui/button';
import { GLOBAL_DISCLAIMER } from '@/lib/medical-rules/disclaimer';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <Brand />
          <nav className="flex items-center gap-2" aria-label="Account">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-muted/40">
        <div className="container space-y-4 py-8 text-sm text-muted-foreground">
          <p className="max-w-3xl">{GLOBAL_DISCLAIMER}</p>
          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Legal">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms of Use
            </Link>
            <Link href="/medical-disclaimer" className="hover:text-foreground">
              Medical Disclaimer
            </Link>
          </nav>
          <p>© {new Date().getFullYear()} HealthPassport Pro</p>
        </div>
      </footer>
    </div>
  );
}
