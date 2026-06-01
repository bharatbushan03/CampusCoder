import React from 'react';
import type { Metadata } from 'next';
import AboutPageClient from './AboutPageClient';

export const metadata: Metadata = {
  title: 'About | CampusCoder',
  description: 'Learn about CampusCoder - a student-led coding community bridging academic learning and industry standards with hands-on technical workshops and sprints.',
};

export default function AboutPage() {
  return <AboutPageClient />;
}
