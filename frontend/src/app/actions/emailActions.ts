'use server';

import { serverApi } from '@/lib/serverApi';
import { z } from 'zod';

const eventIdSchema = z.string().uuid('Invalid event identifier.');

export async function sendMeetingLinkToAll(eventId: string, force: boolean = false) {
  const eventIdValidation = eventIdSchema.safeParse(eventId);
  if (!eventIdValidation.success) {
    throw new Error(eventIdValidation.error.issues[0].message);
  }

  const result = await serverApi<{ ok: boolean; success: boolean; count: number }>(
    `/admin/emails/meeting-link/${eventId}`,
    {
      method: 'POST',
      body: JSON.stringify({ force }),
    }
  );

  return { success: result.success, sent: result.count, total: result.count };
}