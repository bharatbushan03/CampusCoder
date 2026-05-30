'use server';

import { createClient } from '@/utils/supabase/server';
import { eventSchema, resourceSchema, announcementSchema, communityLinkSchema } from '@/lib/validation';
import type { z } from 'zod';

/**
 * Simple sanitization to prevent basic XSS/injection
 */
function sanitizeText(text: string) {
  if (!text) return text;
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

async function verifyAdminRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Authentication required');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'organizer')) {
    throw new Error('Unauthorized: Admin or Organizer role required');
  }

  return user.id;
}

type EventPayload = z.infer<typeof eventSchema>;
type SpeakerPayload = {
  name: string;
  role?: string;
  email?: string;
  bio?: string;
  profile_image_url?: string;
};

export async function createEvent(payload: EventPayload, speakers: SpeakerPayload[]) {
  const adminId = await verifyAdminRole();
  const supabase = await createClient();

  // 1. Server-side Validation
  const validation = eventSchema.safeParse(payload);
  if (!validation.success) {
    throw new Error(validation.error.issues[0].message);
  }

  const data = validation.data;

  // 2. Sanitization
  const sanitizedEvent = {
    ...data,
    title: sanitizeText(data.title),
    short_description: data.short_description ? sanitizeText(data.short_description) : null,
    full_description: data.full_description ? sanitizeText(data.full_description) : null,
    banner_url: data.banner_url || null,
    created_by: adminId,
  };

  // 3. Insert event
  const { data: insertedEvent, error: eventError } = await supabase
    .from('events')
    .insert(sanitizedEvent)
    .select()
    .single();

  if (eventError) {
    if (eventError.code === '23505') {
      throw new Error('An event with this slug already exists. Please choose a unique slug.');
    }
    throw eventError;
  }
  if (!insertedEvent) throw new Error('Event insertion failed.');

  // 4. Insert speakers
  if (speakers && speakers.length > 0) {
    const speakersToInsert = speakers.map((s) => ({
      event_id: insertedEvent.id,
      name: sanitizeText(s.name),
      role: s.role ? sanitizeText(s.role) : null,
      email: s.email ? s.email.toLowerCase().trim() : null,
      bio: s.bio ? sanitizeText(s.bio) : null,
      profile_image_url: s.profile_image_url || null,
    }));

    const { error: speakersError } = await supabase
      .from('event_owners')
      .insert(speakersToInsert);

    if (speakersError) {
      console.error('Failed to insert event owners:', speakersError);
      // We don't fail the whole event creation if speakers fail
    }
  }

  return { success: true, eventId: insertedEvent.id };
}

export async function updateEvent(id: string, payload: EventPayload, speakers: SpeakerPayload[]) {
  await verifyAdminRole();
  const supabase = await createClient();

  const validation = eventSchema.safeParse(payload);
  if (!validation.success) {
    throw new Error(validation.error.issues[0].message);
  }

  const data = validation.data;

  const sanitizedEvent = {
    ...data,
    title: sanitizeText(data.title),
    short_description: data.short_description ? sanitizeText(data.short_description) : null,
    full_description: data.full_description ? sanitizeText(data.full_description) : null,
    banner_url: data.banner_url || null,
  };

  const { error: updateError } = await supabase
    .from('events')
    .update(sanitizedEvent)
    .eq('id', id);

  if (updateError) {
    if (updateError.code === '23505') {
      throw new Error('An event with this slug already exists. Please choose a unique slug.');
    }
    throw updateError;
  }

  // Update speakers: Simplest way is to delete and re-insert
  await supabase.from('event_owners').delete().eq('event_id', id);

  if (speakers && speakers.length > 0) {
    const speakersToInsert = speakers.map((s) => ({
      event_id: id,
      name: sanitizeText(s.name),
      role: s.role ? sanitizeText(s.role) : null,
      email: s.email ? s.email.toLowerCase().trim() : null,
      bio: s.bio ? sanitizeText(s.bio) : null,
      profile_image_url: s.profile_image_url || null,
    }));

    await supabase.from('event_owners').insert(speakersToInsert);
  }

  return { success: true };
}

export async function createAnnouncement(payload: any) {
  const adminId = await verifyAdminRole();
  const supabase = await createClient();

  const validation = announcementSchema.safeParse(payload);
  if (!validation.success) throw new Error(validation.error.issues[0].message);

  const data = validation.data;

  const sanitized = {
    ...data,
    title: sanitizeText(data.title),
    message: sanitizeText(data.message),
    created_by: adminId,
  };

  const { error } = await supabase.from('announcements').insert(sanitized);
  if (error) throw error;

  return { success: true };
}

export async function createCommunityLink(payload: any) {
  await verifyAdminRole();
  const supabase = await createClient();

  const validation = communityLinkSchema.safeParse(payload);
  if (!validation.success) throw new Error(validation.error.issues[0].message);

  const data = validation.data;

  const sanitized = {
    ...data,
    platform: sanitizeText(data.platform),
    url: data.url.toLowerCase().trim(),
  };

  const { error } = await supabase.from('community_links').insert(sanitized);
  if (error) throw error;

  return { success: true };
}

export async function createResource(payload: any) {
  await verifyAdminRole();
  const supabase = await createClient();

  const validation = resourceSchema.safeParse(payload);
  if (!validation.success) throw new Error(validation.error.issues[0].message);

  const data = validation.data;

  const sanitized = {
    ...data,
    title: sanitizeText(data.title),
    description: data.description ? sanitizeText(data.description) : null,
    link: data.link.toLowerCase().trim(),
  };

  const { error } = await supabase.from('resources').insert(sanitized);
  if (error) throw error;

  return { success: true };
}
