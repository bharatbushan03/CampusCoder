import type { Metadata } from 'next';
import EventsPageClient from './EventsPageClient';

export const metadata: Metadata = {
  title: 'Events | CampusCoder',
  description: 'Browse upcoming CampusCoder coding sessions, workshops, webinars, and student community events.',
};

export default function EventsPage() {
  return <EventsPageClient />;
}
