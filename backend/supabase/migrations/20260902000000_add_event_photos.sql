-- Add photos array to events table for event gallery management
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}';
