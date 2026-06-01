import type { Metadata } from 'next';
import RegisterPageClient from './RegisterPageClient';

export const metadata: Metadata = {
  title: 'Register for Events | CampusCoder',
  description: 'Reserve your seat for CampusCoder workshops, webinars, and coding sprints.',
};

export default function RegistrationPage() {
  return <RegisterPageClient />;
}
