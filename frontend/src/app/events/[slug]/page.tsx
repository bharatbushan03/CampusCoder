import type { Metadata } from 'next';
import { serverApi } from '@/lib/serverApi';
import EventDetailsPageClient from './EventDetailsPageClient';

export const metadata: Metadata = {
  title: 'Event Details | CampusCoder',
  description: 'View CampusCoder event details, schedule, registration status, and learning outcomes.',
};

export default async function EventDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let event = null;
  try {
    const data = await serverApi<{ ok: boolean; event: Record<string, unknown> | null }>(
      `/events/slug/${slug}`
    );
    event = data.event;
  } catch {
    event = null;
  }

  return <EventDetailsPageClient initialEvent={event as never} />;
}