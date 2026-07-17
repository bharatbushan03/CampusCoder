-- Add meeting_link_sent_at to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS meeting_link_sent_at timestamp with time zone;
