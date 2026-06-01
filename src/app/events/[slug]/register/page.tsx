import type { Metadata } from 'next';
import EventRegistrationPageClient from './EventRegistrationPageClient';

export const metadata: Metadata = {
  title: 'Event Registration | CampusCoder',
  description: 'Register for a CampusCoder event and reserve your seat for the session.',
};

export default function EventRegistrationPage() {
  return <EventRegistrationPageClient />;
}
