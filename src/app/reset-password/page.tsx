import type { Metadata } from 'next';
import ResetPasswordPageClient from './ResetPasswordPageClient';

export const metadata: Metadata = {
  title: 'Reset Password | CampusCoder',
  description: 'Set a new password for your CampusCoder account.',
};

export default function ResetPasswordPage() {
  return <ResetPasswordPageClient />;
}
