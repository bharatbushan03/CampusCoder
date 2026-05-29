import { z } from 'zod';

export const registrationSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\d{10,15}$/, 'Phone must be between 10 and 15 digits'),
  college: z.string().min(2, 'College name is required').max(150),
  branch: z.string().min(2, 'Branch is required').max(100),
  year: z.string().min(1, 'Year is required'),
  codingLevel: z.string().optional(),
  preferredLanguage: z.string().optional(),
  reasonToJoin: z.string().max(500, 'Reason must be less than 500 characters').optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: 'You must agree to receive updates',
  }),
});

export const eventSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric and hyphens only'),
  short_description: z.string().max(250).optional(),
  full_description: z.string().optional(),
  event_type: z.enum(['workshop', 'coding_session', 'orientation', 'challenge', 'webinar']),
  mode: z.enum(['online', 'offline', 'hybrid']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  start_time: z.string(),
  end_time: z.string(),
  meeting_link: z.string().url().or(z.literal('')).optional(),
  registration_deadline: z.string().optional(),
  status: z.enum(['draft', 'published', 'completed', 'cancelled']),
});

export const announcementSchema = z.object({
  title: z.string().min(3, 'Title is too short').max(150),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  event_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().default(true),
  publish_date: z.string(),
});

export const communityLinkSchema = z.object({
  platform: z.string().min(2, 'Platform name is required').max(50),
  url: z.string().url('Invalid URL format'),
  is_active: z.boolean().default(true),
});

export const resourceSchema = z.object({
  title: z.string().min(3, 'Title is too short').max(150),
  description: z.string().max(500).optional(),
  link: z.string().url('Invalid URL format'),
  category: z.enum(['roadmaps', 'practice', 'dsa', 'placement', 'general']),
  event_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().default(true),
});
