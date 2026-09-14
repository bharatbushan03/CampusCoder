-- Add photos_zip_url and photos_drive_url to events table
-- Store an optional downloadable media archive on the event.
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS photos_zip_url text DEFAULT NULL;
ALTER TABLE public.events DROP COLUMN IF EXISTS photos_drive_url;

