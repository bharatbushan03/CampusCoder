import type { Metadata } from 'next';
import SignupPageClient from './SignupPageClient';

export const metadata: Metadata = {
  title: 'Create Account | CampusCoder',
  description: 'Create a CampusCoder account to join events, track progress, and connect with the community.',
};

export default function SignupPage() {
  return <SignupPageClient />;
}
