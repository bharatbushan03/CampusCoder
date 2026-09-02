import React from 'react';
import { AdminNotificationEmail } from '../components/emails/AdminNotification';
import { RegistrationConfirmationEmail } from '../components/emails/RegistrationConfirmation';
import { ADMIN_EMAIL, sendAppEmail } from '../lib/email';
import { getErrorMessage } from '../lib/errors';
import type { Database } from '../types/database.types';
import { createAnonClient } from '../middleware/auth';
import { backgroundQueue } from './queue';

export type RegistrationEmailData = {
  full_name: string;
  email: string;
  phone?: string | null;
  college: string;
  branch: string;
  year?: string | number | null;
  coding_level?: string | null;
  preferred_language?: string | null;
};

export type RegistrationEventData = {
  title: string;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  mode: string;
  event_type?: string | null;
  meeting_link?: string | null;
  short_description?: string | null;
};

type CommunityLink = Pick<
  Database['public']['Tables']['community_links']['Row'],
  'platform' | 'url'
>;

/**
 * Formats event date into human readable string (e.g. Saturday, September 5, 2026)
 */
function formatEventDate(dateStr?: string | null): string {
  if (!dateStr || dateStr.toLowerCase() === 'tbc') return 'Date to be announced';
  try {
    const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formats start and end times into clean 12-hour AM/PM string (e.g. 06:00 PM – 08:00 PM IST)
 */
function formatEventTime(startTime?: string | null, endTime?: string | null): string {
  if (!startTime) return 'Time to be announced';

  const formatSingleTime = (t: string) => {
    try {
      const parts = t.split(':');
      if (parts.length >= 2) {
        const hours = parseInt(parts[0], 10);
        const minutes = parts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
        return `${formattedHours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
      }
      return t;
    } catch {
      return t;
    }
  };

  const formattedStart = formatSingleTime(startTime);
  if (endTime) {
    const formattedEnd = formatSingleTime(endTime);
    return `${formattedStart} – ${formattedEnd} (IST)`;
  }
  return `${formattedStart} (IST)`;
}

/**
 * Returns formatted venue label and details based on event mode
 */
function formatEventVenue(mode?: string | null, meetingLink?: string | null): { venueLabel: string; venueDetails: string } {
  const m = (mode || 'online').toLowerCase();
  if (m === 'offline') {
    return {
      venueLabel: 'In-Person (Campus Venue)',
      venueDetails: 'Campus Coding Lab / Seminar Hall (Please arrive 10 minutes prior)',
    };
  }
  if (m === 'hybrid') {
    return {
      venueLabel: 'Hybrid (In-Person & Online Live Stream)',
      venueDetails: meetingLink 
        ? `Join in campus lab or online via: ${meetingLink}` 
        : 'In-person lab seats + online link sent prior to session',
    };
  }
  return {
    venueLabel: 'Online (Virtual Session)',
    venueDetails: meetingLink 
      ? `Meeting Link: ${meetingLink}` 
      : 'Live stream / Google Meet link will be shared via email & Discord before session starts',
  };
}

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

    const formattedDate = formatEventDate(eventData.date);
    const formattedTime = formatEventTime(eventData.start_time, eventData.end_time);
    const { venueLabel, venueDetails } = formatEventVenue(eventData.mode, eventData.meeting_link);

    // Queue student confirmation email in background worker
    backgroundQueue.add(
      `reg_confirm_${registrationData.email}_${Date.now()}`,
      { registrationData, eventData, links, formattedDate, formattedTime, venueLabel, venueDetails },
      async ({ registrationData: reg, eventData: ev, links: commLinks, formattedDate: d, formattedTime: t, venueLabel: vl, venueDetails: vd }) => {
        await sendAppEmail({
          to: reg.email,
          subject: `🎉 Registration Confirmed: ${ev.title}`,
          react: (
            <RegistrationConfirmationEmail
              studentName={reg.full_name}
              studentEmail={reg.email}
              college={reg.college}
              branch={reg.branch}
              year={reg.year ?? undefined}
              codingLevel={reg.coding_level ?? undefined}
              preferredLanguage={reg.preferred_language ?? undefined}
              eventTitle={ev.title}
              eventType={ev.event_type ?? 'workshop'}
              eventDate={d}
              eventTime={t}
              mode={ev.mode}
              venueLabel={vl}
              venueDetails={vd}
              meetingLink={ev.meeting_link}
              shortDescription={ev.short_description}
              communityLinks={commLinks}
            />
          ),
        });
      }
    );

    // Queue admin notification email in background worker
    if (ADMIN_EMAIL) {
      backgroundQueue.add(
        `reg_admin_${registrationData.email}_${Date.now()}`,
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
