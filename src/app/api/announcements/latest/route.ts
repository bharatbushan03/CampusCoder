import { NextResponse } from 'next/server';
import type { Database } from '@/types/database.types';
import { isSupabaseConfigured } from '@/utils/supabase/config';
import { createClient } from '@/utils/supabase/server';

type AnnouncementRow = Database['public']['Tables']['announcements']['Row'];
type EventSummary = Pick<Database['public']['Tables']['events']['Row'], 'title' | 'slug'>;
type AnnouncementWithEvent = AnnouncementRow & { events?: EventSummary | null };

export const dynamic = 'force-dynamic';

function emptyResponse() {
  return NextResponse.json(
    { announcement: null },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return emptyResponse();
  }

  try {
    const supabase = await createClient();
    const nowStr = new Date().toISOString();

    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .lte('publish_date', nowStr)
      .order('publish_date', { ascending: false })
      .limit(1)
      .returns<AnnouncementRow[]>();

    if (error || !data?.[0]) {
      return emptyResponse();
    }

    const latest: AnnouncementWithEvent = data[0];

    if (latest.event_id) {
      const { data: event } = await supabase
        .from('events')
        .select('title, slug')
        .eq('id', latest.event_id)
        .maybeSingle()
        .returns<EventSummary | null>();

      latest.events = event || null;
    }

    return NextResponse.json(
      { announcement: latest },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return emptyResponse();
  }
}
