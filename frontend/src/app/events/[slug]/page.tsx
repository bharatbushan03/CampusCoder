import type { Metadata } from 'next';
import { createClient } from '@backend/utils/supabase/server';
import EventDetailsPageClient from './EventDetailsPageClient';

export const metadata: Metadata = {
  title: 'Event Details | CampusCoder',
  description: 'View CampusCoder event details, schedule, registration status, and learning outcomes.',
};

interface EventData {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  full_description: string | null;
  event_type: string;
  mode: string;
  date: string;
  start_time: string;
  end_time: string;
  meeting_link: string | null;
  registration_deadline: string | null;
  banner_url: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  event_owners: Array<{
    id: string;
    event_id: string;
    name: string;
    role: string | null;
    email: string | null;
    bio: string | null;
    profile_image_url: string | null;
  }> | null;
}

export default async function EventDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from('events')
    .select('*, event_owners (*)')
    .eq('slug', slug)
    .in('status', ['published', 'completed', 'cancelled'])
    .single()
    .returns<EventData>();

  return <EventDetailsPageClient initialEvent={event} />;
}
