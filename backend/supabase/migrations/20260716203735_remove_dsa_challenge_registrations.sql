-- Remove DSA 7 Days Challenge 2026 registrations from dashboard
-- Run this in Supabase SQL Editor to completely remove DSA challenge from user dashboard

-- First, verify what would be deleted:
SELECT r.id, r.full_name, r.email, r.events_id, e.title, e.slug, e.status
FROM public.registrations r
JOIN public.events e ON r.event_id = e.id
WHERE e.slug LIKE '%dsa%' OR e.title LIKE '%7 days challenge%' OR e.slug = 'dsa-7-days-challenge-2026';

-- Delete the registrations:
DELETE FROM public.registrations
WHERE event_id IN (
  SELECT id
  FROM public.events
  WHERE slug = 'dsa-7-days-challenge-2026'
    OR title ILIKE '%7 days challenge%'
    OR slug ILIKE '%dsa%'
);

-- Update event status to completed if not already
UPDATE public.events
SET status = 'completed',
    updated_at = timezone('utc'::text, now())
WHERE slug = 'dsa-7-days-challenge-2026'
  AND status = 'published';