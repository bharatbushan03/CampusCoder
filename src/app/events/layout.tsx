import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events | CampusCoder',
  description: 'Browse upcoming CampusCoder workshops, coding sessions, webinars, and community sprints.',
};

export default function EventsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
