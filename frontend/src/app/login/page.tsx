import type { Metadata } from 'next';
import LoginPageClient from './LoginPageClient';

export const metadata: Metadata = {
  title: 'Login | CampusCoder',
  description: 'Sign in to CampusCoder to access your dashboard and manage events.',
};

export default function LoginPage() {
  return <LoginPageClient />;
}
