import type { Metadata } from 'next';
import ArchiveEventsPageClient from './ArchiveEventsPageClient';

export const metadata: Metadata = {
  title: 'Event Archive | CampusCoder',
  description: 'Browse past CampusCoder events with recordings, slides, and project resources.',
};

export default function ArchiveEventsPage() {
  return <ArchiveEventsPageClient />;
}
