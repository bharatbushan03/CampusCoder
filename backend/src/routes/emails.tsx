import React from 'react';
import { Router, type Request, type Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { createAdminClient } from '../utils/supabase/admin';
import { sendAppEmail } from '../lib/email';
import { MeetingLinkEmail } from '../components/emails/MeetingLinkAnnouncement';
import { EVENT_DATE_LABEL, EVENT_TIME_LABEL } from '../lib/eventSchedule';
import type { Database } from '../types/database.types';

const router = Router();

router.use(requireAuth, requireRole('admin', 'organizer'));

type MeetingRecipient = Pick<Database['public']['Tables']['registrations']['Row'], 'email' | 'full_name'>;

router.post('/meeting-link/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const force = Boolean(req.body.force) || false;
    const supabase = createAdminClient();

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ ok: false, error: 'Event not found' });
    }
    if (!event.meeting_link) {
      return res.status(400).json({ ok: false, error: 'Meeting link not set for this event' });
    }

    if (event.meeting_link_sent_at && !force) {
      return res.status(400).json({ ok: false, error: 'Meeting link already sent. Use force to resend.' });
    }

    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('email, full_name')
      .eq('event_id', eventId)
      .returns<MeetingRecipient[]>();

    if (regError) throw regError;
    if (!registrations || registrations.length === 0) {
      return res.status(400).json({ ok: false, error: 'No registrations found' });
    }

    const emailPromises = registrations.map((reg) =>
      sendAppEmail({
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

    const { error: updateError } = await supabase
      .from('events')
      .update({ meeting_link_sent_at: new Date().toISOString() })
      .eq('id', eventId);

    if (updateError) {
      console.error('Failed to update sent timestamp:', updateError);
    }

    return res.json({ ok: true, success: true, count: registrations.length });
  } catch (error: any) {
    console.error('Failed to send meeting link emails:', error);
    return res.status(500).json({ ok: false, error: error.message || 'Failed to send meeting link' });
  }
});

export { router as emailsRouter };
