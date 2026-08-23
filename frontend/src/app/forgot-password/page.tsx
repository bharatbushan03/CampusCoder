import type { Metadata } from 'next';
import { Suspense } from 'react';
import ForgotPasswordPageClient from './ForgotPasswordPageClient';
import { CampusCoderLoader } from '@/components/ui/CampusCoderLoader';

export const metadata: Metadata = {
  title: 'Forgot Password | CampusCoder',
  description: 'Request a CampusCoder password reset link for your student account.',
};

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <CampusCoderLoader size="lg" text="Loading..." />
        </div>
      }
    >
      <ForgotPasswordPageClient />
    </Suspense>
  );
}
