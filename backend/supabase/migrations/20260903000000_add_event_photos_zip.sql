-- Add photos_zip_url and photos_drive_url to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS photos_zip_url text DEFAULT NULL;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS photos_drive_url text DEFAULT NULL;

