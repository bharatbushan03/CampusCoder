import type { Metadata } from 'next';
import { Suspense } from 'react';
import SignupPageClient from './SignupPageClient';
import { CampusCoderLoader } from '@/components/ui/CampusCoderLoader';

export const metadata: Metadata = {
  title: 'Create Account | CampusCoder',
  description: 'Create a CampusCoder account to join events, track progress, and connect with the community.',
};

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <CampusCoderLoader size="lg" text="Loading signup..." />
        </div>
      }
    >
      <SignupPageClient />
    </Suspense>
  );
}
