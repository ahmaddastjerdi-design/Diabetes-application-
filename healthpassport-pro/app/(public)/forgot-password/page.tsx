import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/components/forms/auth-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const metadata: Metadata = { title: 'Reset your password' };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      description="We'll email you a secure link to reset it."
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to log in
        </Link>
      }
    >
      <form className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <Button type="submit" className="w-full" disabled>
          Send reset link
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Password reset is activated in Phase 2.
        </p>
      </form>
    </AuthCard>
  );
}
