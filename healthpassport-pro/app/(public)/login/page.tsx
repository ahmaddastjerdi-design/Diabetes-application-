import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/components/forms/auth-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const metadata: Metadata = { title: 'Log in' };

export default function LoginPage() {
  return (
    <AuthCard
      title="Log in"
      description="Access your health record."
      footer={
        <>
          New here?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled>
          Log in
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Authentication is activated in Phase 2.
        </p>
      </form>
    </AuthCard>
  );
}
