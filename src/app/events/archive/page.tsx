import type { Metadata } from 'next';
import ArchiveEventsPageClient from './ArchiveEventsPageClient';

export const metadata: Metadata = {
  title: 'Event Archive | CampusCoder',
  description: 'Review past CampusCoder workshops, coding sessions, webinars, and student sprints.',
};

export default function ArchiveEventsPage() {
  return <ArchiveEventsPageClient />;
}
