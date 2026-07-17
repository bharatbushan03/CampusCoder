-- Move 7 Days DSA Challenge 2026 from upcoming to past events
-- Update event status from 'published' to 'completed' so it appears in archive instead of upcoming events

UPDATE public.events
SET
    status = 'completed',
    updated_at = timezone('utc'::text, now())
WHERE slug = 'dsa-7-days-challenge-2026'
  AND status = 'published';