import type { Metadata } from 'next';
import HomePageClient from './HomePageClient';

export const metadata: Metadata = {
  title: 'CampusCoder | Student Coding Community',
  description: 'Join a student-led coding community for workshops, placement preparation, HackerRank practice, coding challenges, and peer learning.',
};

export default function HomePage() {
  return <HomePageClient />;
}
