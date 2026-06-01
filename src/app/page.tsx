import type { Metadata } from 'next';
import HomePageClient from './HomePageClient';

export const metadata: Metadata = {
  title: 'CampusCoder | Student Coding Community',
  description: 'Join CampusCoder for student-friendly coding workshops, sprints, resources, and peer learning.',
};

export default function HomePage() {
  return <HomePageClient />;
}
