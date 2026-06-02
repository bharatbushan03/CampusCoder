import React from 'react';
import type { Metadata } from 'next';
import AboutPageClient from './AboutPageClient';

export const metadata: Metadata = {
  title: 'About | CampusCoder',
  description: 'Learn about CampusCoder - a student-run coding community for workshops, placement prep, and peer learning.',
};

export default function AboutPage() {
  return <AboutPageClient />;
}
