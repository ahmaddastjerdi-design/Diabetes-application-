import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/components/forms/auth-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const metadata: Metadata = { title: 'Create your account' };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Your record is private and belongs to you."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
          <p className="text-xs text-muted-foreground">
            Use at least 8 characters.
          </p>
        </div>
        <Button type="submit" className="w-full" disabled>
          Create account
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to our{' '}
          <Link href="/terms" className="underline">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          . Registration is activated in Phase 2.
        </p>
      </form>
    </AuthCard>
  );
}
