import type { Metadata } from 'next';
import EventsPageClient from './EventsPageClient';

export const metadata: Metadata = {
  title: 'Events | CampusCoder',
  description: 'Find coding sessions, workshops, and community events organized by CampusCoder.',
};

export default function EventsPage() {
  return <EventsPageClient />;
}
