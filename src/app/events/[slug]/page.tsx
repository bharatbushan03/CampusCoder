import type { Metadata } from 'next';
import EventDetailsPageClient from './EventDetailsPageClient';

export const metadata: Metadata = {
  title: 'Event Details | CampusCoder',
  description: 'View CampusCoder event details, schedule, registration status, and learning outcomes.',
};

export default function EventDetailsPage() {
  return <EventDetailsPageClient />;
}
