'use server';

import { resend, FROM_EMAIL } from '@/lib/email';
import { MeetingLinkEmail } from '@/components/emails/MeetingLinkAnnouncement';
import { createClient } from '@/utils/supabase/server';
import { EVENT_DATE_LABEL, EVENT_TIME_LABEL } from '@/lib/eventSchedule';
import type { Database } from '@/types/database.types';

type MeetingRecipient = Pick<Database['public']['Tables']['registrations']['Row'], 'email' | 'full_name'>;

export async function sendMeetingLinkToAll(eventId: string, force: boolean = false) {
  const emailClient = resend;
  if (!emailClient) throw new Error('Email service not configured');

  try {
    const supabase = await createClient();

    // 1. Role Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'organizer')) {
      throw new Error('Forbidden');
    }

    // 2. Fetch Event Details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) throw new Error('Event not found');
    if (!event.meeting_link) throw new Error('Meeting link not set for this event');
    
    // Check if already sent
    if (event.meeting_link_sent_at && !force) {
      throw new Error('Meeting link already sent. Use force to resend.');
    }

    // Fetch all registrations for this event
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('email, full_name')
      .eq('event_id', eventId)
      .returns<MeetingRecipient[]>();

    if (regError) throw regError;
    if (!registrations || registrations.length === 0) throw new Error('No registrations found');

    // Send emails
    const emailPromises = registrations.map((reg) =>
      emailClient.emails.send({
        from: FROM_EMAIL,
        to: reg.email,
        subject: `Meeting Link: ${event.title}`,
        react: (
          <MeetingLinkEmail
            studentName={reg.full_name}
            eventTitle={event.title}
            eventDate={EVENT_DATE_LABEL}
            eventTime={EVENT_TIME_LABEL}
            meetingLink={event.meeting_link!}
          />
        ),
      })
    );

    await Promise.all(emailPromises);

    // Update sent timestamp
    const { error: updateError } = await supabase
      .from('events')
      .update({ meeting_link_sent_at: new Date().toISOString() })
      .eq('id', eventId);
    
    if (updateError) {
      console.error('Failed to update sent timestamp:', updateError);
      // Don't throw here since emails were sent successfully
    }

    return { success: true, count: registrations.length };
  } catch (error) {
    console.error('Failed to send meeting link emails:', error);
    throw error;
  }
}
