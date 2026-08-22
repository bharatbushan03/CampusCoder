import { z } from 'zod';

export const registrationSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.email('Invalid email address'),
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
  short_description: z.string().max(250).nullable().optional(),
  full_description: z.string().nullable().optional(),
  event_type: z.enum(['workshop', 'coding_session', 'orientation', 'challenge', 'webinar']),
  mode: z.enum(['online', 'offline', 'hybrid']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  start_time: z.string(),
  end_time: z.string(),
  meeting_link: z.url().or(z.literal('')).nullable().optional(),
  registration_deadline: z.string().nullable().optional(),
  banner_url: z.url().or(z.literal('')).nullable().optional(),
  status: z.enum(['draft', 'published', 'completed', 'cancelled']),
}).refine((data) => data.end_time > data.start_time, {
  message: 'End time must be after start time',
  path: ['end_time'],
});

export const announcementSchema = z.object({
  title: z.string().min(3, 'Title is too short').max(150),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  event_id: z.uuid().nullable().optional(),
  is_active: z.boolean().default(true),
  publish_date: z.string(),
});

export const communityLinkSchema = z.object({
  platform: z.string().min(2, 'Platform name is required').max(50),
  url: z.url('Invalid URL format'),
  is_active: z.boolean().default(true),
});

export const resourceSchema = z.object({
  title: z.string().min(3, 'Title is too short').max(150),
  description: z.string().max(500).optional(),
  link: z.url('Invalid URL format'),
  category: z.enum(['roadmaps', 'practice', 'dsa', 'placement', 'general']),
  event_id: z.uuid().nullable().optional(),
  is_active: z.boolean().default(true),
});

export const studentUpdateSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  college: z.string().max(150).optional().nullable(),
  branch: z.string().max(100).optional().nullable(),
  year: z.string().max(20).optional().nullable(),
  role: z.enum(['student', 'admin', 'organizer']).optional(),
});
