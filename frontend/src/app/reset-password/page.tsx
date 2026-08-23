import type { Metadata } from 'next';
import { Suspense } from 'react';
import ResetPasswordPageClient from './ResetPasswordPageClient';
import { CampusCoderLoader } from '@/components/ui/CampusCoderLoader';

export const metadata: Metadata = {
  title: 'Reset Password | CampusCoder',
  description: 'Set a new password for your CampusCoder account.',
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <CampusCoderLoader size="lg" text="Loading..." />
        </div>
      }
    >
      <ResetPasswordPageClient />
    </Suspense>
  );
}
