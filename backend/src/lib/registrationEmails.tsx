import React from 'react';
import { AdminNotificationEmail } from '../components/emails/AdminNotification';
import { RegistrationConfirmationEmail } from '../components/emails/RegistrationConfirmation';
import { ADMIN_EMAIL, sendAppEmail } from '../lib/email';
import { EVENT_DATE_LABEL, EVENT_TIME_LABEL } from '../lib/eventSchedule';
import { getErrorMessage } from '../lib/errors';
import type { Database } from '../types/database.types';
import { createAnonClient } from '../middleware/auth';
import { backgroundQueue } from './queue';

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
  try {
    const supabase = createAnonClient();

    const { data: communityLinks } = await supabase
      .from('community_links')
      .select('platform, url')
      .eq('is_active', true)
      .returns<CommunityLink[]>();

    const links = communityLinks || [];

    // Queue student confirmation email in background worker
    backgroundQueue.add(
      `reg_confirm_${registrationData.email}`,
      { registrationData, eventData, links },
      async ({ registrationData: reg, eventData: ev, links: commLinks }) => {
        await sendAppEmail({
          to: reg.email,
          subject: `Registration Confirmed: ${ev.title}`,
          react: (
            <RegistrationConfirmationEmail
              studentName={reg.full_name}
              eventTitle={ev.title}
              eventDate={EVENT_DATE_LABEL}
              eventTime={EVENT_TIME_LABEL}
              mode={ev.mode}
              communityLinks={commLinks}
            />
          ),
        });
      }
    );

    // Queue admin notification email in background worker
    if (ADMIN_EMAIL) {
      backgroundQueue.add(
        `reg_admin_${registrationData.email}`,
        { registrationData, eventData },
        async ({ registrationData: reg, eventData: ev }) => {
          await sendAppEmail({
            to: ADMIN_EMAIL,
            subject: `New Registration: ${ev.title} - ${reg.full_name}`,
            react: (
              <AdminNotificationEmail
                studentName={reg.full_name}
                studentEmail={reg.email}
                eventTitle={ev.title}
                college={reg.college}
                branch={reg.branch}
              />
            ),
          });
        }
      );
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to enqueue registration emails:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Failed to send registration emails'),
    };
  }
}
