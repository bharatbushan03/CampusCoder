import type { Metadata } from 'next';
import SignupPageClient from './SignupPageClient';

export const metadata: Metadata = {
  title: 'Create Account | CampusCoder',
  description: 'Create a CampusCoder account to join coding sessions, track progress, and access student resources.',
};

export default function SignupPage() {
  return <SignupPageClient />;
}
