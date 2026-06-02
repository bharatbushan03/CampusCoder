import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events | CampusCoder',
  description: 'Browse coding sessions, workshops, and community events from CampusCoder.',
};

export default function EventsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
