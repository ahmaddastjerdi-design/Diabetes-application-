import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/components/forms/auth-card';
import { LoginForm } from '@/components/forms/login-form';

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
      <LoginForm />
    </AuthCard>
  );
}
