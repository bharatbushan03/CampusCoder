-- Move 7 Days DSA Challenge 2026 from published to completed (past events)
-- This event was at slug 'dsa-7-days-challenge-2026' and date 2026-06-22 to 2026-06-28

update public.events
set status = 'completed',
    updated_at = timezone('utc'::text, now())
where slug = 'dsa-7-days-challenge-2026'
  and status = 'published';