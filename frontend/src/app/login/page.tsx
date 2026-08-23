import type { Metadata } from 'next';
import { Suspense } from 'react';
import LoginPageClient from './LoginPageClient';
import { CampusCoderLoader } from '@/components/ui/CampusCoderLoader';

export const metadata: Metadata = {
  title: 'Login | CampusCoder',
  description: 'Sign in to CampusCoder to access your dashboard and manage events.',
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <CampusCoderLoader size="lg" text="Loading..." />
        </div>
      }
    >
      <LoginPageClient />
    </Suspense>
  );
}
