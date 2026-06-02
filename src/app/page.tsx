import type { Metadata } from 'next';
import HomePageClient from './HomePageClient';

export const metadata: Metadata = {
  title: 'CampusCoder | Student Coding Community',
  description: 'A student-run coding community for workshops, placement prep, coding challenges, and peer learning.',
};

export default function HomePage() {
  return <HomePageClient />;
}
