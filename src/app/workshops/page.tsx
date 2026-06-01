import type { Metadata } from 'next';
import WorkshopsPageClient from './WorkshopsPageClient';

export const metadata: Metadata = {
  title: 'Workshops | CampusCoder',
  description: 'Explore practical CampusCoder workshops for web development, coding practice, and career preparation.',
};

export default function WorkshopsPage() {
  return <WorkshopsPageClient />;
}
