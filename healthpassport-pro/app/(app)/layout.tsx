import { Brand } from '@/components/layout/brand';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { BottomNav } from '@/components/layout/bottom-nav';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { UserMenu } from '@/components/layout/user-menu';
import { MedicalDisclaimer } from '@/components/safety/medical-disclaimer';

// NOTE: this shell is public in Phase 1. Route protection (redirect to /login
// for unauthenticated users) is added in Phase 2 with NextAuth middleware.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-card lg:flex lg:flex-col print:!hidden">
        <div className="flex h-16 items-center border-b px-4">
          <Brand href="/dashboard" />
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <SidebarNav />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur print:hidden">
          <div className="lg:hidden">
            <Brand href="/dashboard" />
          </div>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <main
          id="main-content"
          className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 pb-24 lg:pb-10"
        >
          {children}
        </main>

        <footer className="hidden border-t px-4 py-4 lg:block print:hidden">
          <div className="mx-auto max-w-4xl">
            <MedicalDisclaimer variant="compact" />
          </div>
        </footer>
      </div>

      <div className="print:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
