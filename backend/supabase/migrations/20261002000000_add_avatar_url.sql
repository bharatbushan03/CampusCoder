-- Add avatar_url to profiles table for student profile pictures
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text DEFAULT NULL;
