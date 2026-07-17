import type { Metadata } from 'next';
import ForgotPasswordPageClient from './ForgotPasswordPageClient';

export const metadata: Metadata = {
  title: 'Forgot Password | CampusCoder',
  description: 'Request a CampusCoder password reset link for your student account.',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordPageClient />;
}
