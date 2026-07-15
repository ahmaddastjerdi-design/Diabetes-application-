import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/components/forms/auth-card';
import { ForgotForm } from '@/components/forms/forgot-form';

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
      <ForgotForm />
    </AuthCard>
  );
}
