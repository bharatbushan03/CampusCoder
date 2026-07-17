import type { Metadata } from 'next';
import WorkshopsPageClient from './WorkshopsPageClient';

export const metadata: Metadata = {
  title: 'Workshops | CampusCoder',
  description: 'Hands-on workshops on web development, coding practice, and career prep from CampusCoder.',
};

export default function WorkshopsPage() {
  return <WorkshopsPageClient />;
}
