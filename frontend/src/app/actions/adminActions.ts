'use server';

import { serverApi } from '@/lib/serverApi';
import { 
  eventSchema, 
  resourceSchema, 
  competitionSchema, 
  noteSchema,
  noteFolderSchema,
  batchNotesSchema,
  announcementSchema, 
  communityLinkSchema, 
  studentUpdateSchema 
} from '@/lib/validation';
import type { z } from 'zod';

type EventPayload = z.infer<typeof eventSchema>;
type NotePayload = z.input<typeof noteSchema>;
type SpeakerPayload = {
  name: string;
  role?: string;
  email?: string;
  bio?: string;
  profile_image_url?: string;
};

export async function createEvent(payload: EventPayload, speakers: SpeakerPayload[]) {
  try {
    const result = await serverApi<{ ok: boolean; success: boolean; eventId: string }>('/admin/events', {
      method: 'POST',
      body: JSON.stringify({ payload, speakers }),
    });

    return { success: result.success, eventId: result.eventId };
  } catch (err: any) {
    console.error('[createEvent action error]:', err);
    return {
      success: false,
      error: err.message || 'Failed to create sprint event.',
    };
  }
}

export async function updateEvent(id: string, payload: EventPayload, speakers: SpeakerPayload[]) {
  try {
    await serverApi(`/admin/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ payload, speakers }),
    });

    return { success: true };
  } catch (err: any) {
    console.error('[updateEvent action error]:', err);
    return {
      success: false,
      error: err.message || 'Failed to update sprint event.',
    };
  }
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

export async function toggleResource(id: string) {
  await serverApi(`/admin/resources/${id}/toggle`, {
    method: 'PATCH',
  });

  return { success: true };
}

export async function deleteResource(id: string) {
  await serverApi(`/admin/resources/${id}`, {
    method: 'DELETE',
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

export async function createCompetition(payload: z.infer<typeof competitionSchema>) {
  const result = await serverApi<{ ok: boolean; competition: any }>('/admin/competitions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return { success: true, competition: result.competition };
}

export async function updateCompetition(id: string, payload: z.infer<typeof competitionSchema>) {
  const result = await serverApi<{ ok: boolean; competition: any }>(`/admin/competitions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return { success: true, competition: result.competition };
}

export async function toggleCompetition(id: string) {
  await serverApi(`/admin/competitions/${id}/toggle`, {
    method: 'PATCH',
  });

  return { success: true };
}

export async function deleteCompetition(id: string) {
  await serverApi(`/admin/competitions/${id}`, {
    method: 'DELETE',
  });

  return { success: true };
}

export async function createNote(payload: NotePayload) {
  const result = await serverApi<{ ok: boolean; note: any }>('/admin/notes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return { success: true, note: result.note };
}

export async function updateNote(id: string, payload: NotePayload) {
  const result = await serverApi<{ ok: boolean; note: any }>(`/admin/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return { success: true, note: result.note };
}

export async function toggleNote(id: string) {
  await serverApi(`/admin/notes/${id}/toggle`, {
    method: 'PATCH',
  });

  return { success: true };
}

export async function deleteNote(id: string) {
  await serverApi(`/admin/notes/${id}`, {
    method: 'DELETE',
  });

  return { success: true };
}

type NoteFolderPayload = z.input<typeof noteFolderSchema>;
type BatchNotesPayload = z.input<typeof batchNotesSchema>;

export async function createNoteFolder(payload: NoteFolderPayload) {
  const result = await serverApi<{ ok: boolean; folder: any }>('/admin/notes/folders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return { success: true, folder: result.folder };
}

export async function updateNoteFolder(id: string, payload: Partial<NoteFolderPayload>) {
  const result = await serverApi<{ ok: boolean; folder: any }>(`/admin/notes/folders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return { success: true, folder: result.folder };
}

export async function deleteNoteFolder(id: string) {
  await serverApi(`/admin/notes/folders/${id}`, {
    method: 'DELETE',
  });

  return { success: true };
}

export async function batchCreateNotes(payload: BatchNotesPayload) {
  const result = await serverApi<{ ok: boolean; notes: any[] }>('/admin/notes/batch', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return { success: true, notes: result.notes };
}

export async function updateSubjectNotes(
  code: string,
  payload: { newCode?: string; subject?: string; year?: string; semester?: string; branch?: string }
) {
  const result = await serverApi<{ ok: boolean }>(`/admin/notes/subject/${encodeURIComponent(code)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return { success: result.ok };
}

export async function deleteSubjectNotes(code: string) {
  const result = await serverApi<{ ok: boolean }>(`/admin/notes/subject/${encodeURIComponent(code)}`, {
    method: 'DELETE',
  });

  return { success: result.ok };
}
