'use server';

import { serverApi } from '@/lib/serverApi';
import { registrationSchema } from '@/lib/validation';
import type { z } from 'zod';

type RegistrationPayload = z.infer<typeof registrationSchema>;

export async function registerForEvent(payload: RegistrationPayload, eventId: string) {
  const result = await serverApi<{ ok: boolean; success: boolean }>('/events/registrations', {
    method: 'POST',
    body: JSON.stringify({ eventId, ...payload }),
  });

  return { success: result.success };
}