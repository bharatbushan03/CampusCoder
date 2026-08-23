import type { Metadata } from 'next';
import { Suspense } from 'react';
import RegisterPageClient from './RegisterPageClient';
import { CampusCoderLoader } from '@/components/ui/CampusCoderLoader';

export const metadata: Metadata = {
  title: 'Register for Events | CampusCoder',
  description: 'Reserve your seat for CampusCoder workshops, webinars, and coding sprints.',
};

export default function RegistrationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <CampusCoderLoader size="lg" text="Loading..." />
        </div>
      }
    >
      <RegisterPageClient />
    </Suspense>
  );
}
