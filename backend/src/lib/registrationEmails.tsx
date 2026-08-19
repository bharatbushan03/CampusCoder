import { AdminNotificationEmail } from '../components/emails/AdminNotification';
import { RegistrationConfirmationEmail } from '../components/emails/RegistrationConfirmation';
import { ADMIN_EMAIL, FROM_EMAIL, resend } from '../lib/email';
import { EVENT_DATE_LABEL, EVENT_TIME_LABEL } from '../lib/eventSchedule';
import { getErrorMessage } from '../lib/errors';
import type { Database } from '../types/database.types';
import { createAnonClient } from '../middleware/auth';

type RegistrationEmailData = {
  full_name: string;
  email: string;
  college: string;
  branch: string;
};

type RegistrationEventData = Pick<
  Database['public']['Tables']['events']['Row'],
  'title' | 'mode'
>;

type CommunityLink = Pick<
  Database['public']['Tables']['community_links']['Row'],
  'platform' | 'url'
>;

export async function sendRegistrationEmails(
  registrationData: RegistrationEmailData,
  eventData: RegistrationEventData
) {
  const emailClient = resend;

  if (!emailClient) {
    console.warn('Resend API key missing, skipping email sending.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const supabase = createAnonClient();

    const { data: communityLinks } = await supabase
      .from('community_links')
      .select('platform, url')
      .eq('is_active', true)
      .returns<CommunityLink[]>();

    const links = communityLinks || [];

    const studentEmailRes = await emailClient.emails.send({
      from: FROM_EMAIL,
      to: registrationData.email,
      subject: `Registration Confirmed: ${eventData.title}`,
      react: (
        <RegistrationConfirmationEmail
          studentName={registrationData.full_name}
          eventTitle={eventData.title}
          eventDate={EVENT_DATE_LABEL}
          eventTime={EVENT_TIME_LABEL}
          mode={eventData.mode}
          communityLinks={links}
        />
      ),
    });

    if (studentEmailRes.error) {
      console.error('Error sending student confirmation email:', studentEmailRes.error);
    }

    const adminEmailRes = await emailClient.emails.send({
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
    return {
      success: false,
      error: getErrorMessage(error, 'Failed to send registration emails'),
    };
  }
}
