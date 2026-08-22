'use server';

import { serverApi } from '@/lib/serverApi';
import { eventSchema, resourceSchema, announcementSchema, communityLinkSchema, studentUpdateSchema } from '@/lib/validation';
import type { z } from 'zod';

type EventPayload = z.infer<typeof eventSchema>;
type SpeakerPayload = {
  name: string;
  role?: string;
  email?: string;
  bio?: string;
  profile_image_url?: string;
};

export async function createEvent(payload: EventPayload, speakers: SpeakerPayload[]) {
  const result = await serverApi<{ ok: boolean; success: boolean; eventId: string }>('/admin/events', {
    method: 'POST',
    body: JSON.stringify({ payload, speakers }),
  });

  return { success: result.success, eventId: result.eventId };
}

export async function updateEvent(id: string, payload: EventPayload, speakers: SpeakerPayload[]) {
  await serverApi(`/admin/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ payload, speakers }),
  });

  return { success: true };
}

export async function createAnnouncement(payload: z.infer<typeof announcementSchema>) {
  await serverApi('/admin/announcements', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return { success: true };
}

export async function updateAnnouncement(id: string, payload: z.infer<typeof announcementSchema>) {
  await serverApi(`/admin/announcements/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return { success: true };
}

export async function createCommunityLink(payload: z.infer<typeof communityLinkSchema>) {
  await serverApi('/admin/community-links', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return { success: true };
}

export async function updateCommunityLink(id: string, payload: z.infer<typeof communityLinkSchema>) {
  await serverApi(`/admin/community-links/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return { success: true };
}

export async function createResource(payload: z.infer<typeof resourceSchema>) {
  await serverApi('/admin/resources', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return { success: true };
}

export async function updateResource(id: string, payload: z.infer<typeof resourceSchema>) {
  await serverApi(`/admin/resources/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return { success: true };
}

export async function updateStudent(id: string, payload: z.infer<typeof studentUpdateSchema>) {
  await serverApi(`/admin/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return { success: true };
}

export async function deleteStudent(id: string) {
  await serverApi(`/admin/students/${id}`, {
    method: 'DELETE',
  });

  return { success: true };
}