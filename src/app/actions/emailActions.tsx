'use server';

import { resend, FROM_EMAIL, ADMIN_EMAIL } from '@/lib/email';
import { RegistrationConfirmationEmail } from '@/components/emails/RegistrationConfirmation';
import { AdminNotificationEmail } from '@/components/emails/AdminNotification';
import { MeetingLinkEmail } from '@/components/emails/MeetingLinkAnnouncement';
import { createClient } from '@/utils/supabase/server';

export async function sendRegistrationEmails(registrationData: any, eventData: any) {
  if (!resend) {
    console.warn('Resend API key missing, skipping email sending.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const supabase = await createClient();
    
    // Fetch active community links
    const { data: communityLinks } = await supabase
      .from('community_links')
      .select('platform, url')
      .eq('is_active', true);

    const links = communityLinks || [];

    // 1. Send Confirmation Email to Student
    const studentEmailRes = await resend.emails.send({
      from: FROM_EMAIL,
      to: registrationData.email,
      subject: `Registration Confirmed: ${eventData.title}`,
      react: (
        <RegistrationConfirmationEmail
          studentName={registrationData.full_name}
          eventTitle={eventData.title}
          eventDate={new Date(eventData.date).toLocaleDateString()}
          eventTime={`${eventData.start_time} - ${eventData.end_time}`}
          mode={eventData.mode}
          communityLinks={links}
        />
      ),
    });

    if (studentEmailRes.error) {
      console.error('Error sending student confirmation email:', studentEmailRes.error);
    }

    // 2. Send Notification Email to Admin
    const adminEmailRes = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New Registration: ${eventData.title} - ${registrationData.full_name}`,
      react: (
        <AdminNotificationEmail
          studentName={registrationData.full_name}
          studentEmail={registrationData.email}
          eventTitle={eventData.title}
          college={registrationData.college}
          branch={registrationData.branch}
        />
      ),
    });

    if (adminEmailRes.error) {
      console.error('Error sending admin notification email:', adminEmailRes.error);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to send registration emails:', error);
    return { success: false, error };
  }
}

export async function sendMeetingLinkToAll(eventId: string, force: boolean = false) {
  if (!resend) return { success: false, error: 'Email service not configured' };

  try {
    const supabase = (await createClient()) as any;

    // 1. Role Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'organizer')) {
      return { success: false, error: 'Forbidden' };
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
      return { success: false, error: 'Meeting link already sent. Use force to resend.' };
    }

    // Fetch all registrations for this event
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('email, full_name')
      .eq('event_id', eventId);

    if (regError) throw regError;
    if (!registrations || registrations.length === 0) return { success: true, message: 'No registrations found', count: 0 };

    // Send emails
    const emailPromises = registrations.map((reg: any) => 
      resend!.emails.send({
        from: FROM_EMAIL,
        to: reg.email,
        subject: `Meeting Link: ${event.title}`,
        react: (
          <MeetingLinkEmail
            studentName={reg.full_name}
            eventTitle={event.title}
            eventDate={new Date(event.date).toLocaleDateString()}
            eventTime={`${event.start_time} - ${event.end_time}`}
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
    
    if (updateError) console.error('Failed to update sent timestamp:', updateError);

    return { success: true, count: registrations.length };
  } catch (error: any) {
    console.error('Failed to send meeting link emails:', error);
    return { success: false, error: error.message };
  }
}
