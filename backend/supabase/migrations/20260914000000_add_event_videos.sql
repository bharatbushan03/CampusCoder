ALTER TABLE public.events ADD COLUMN IF NOT EXISTS videos text[] DEFAULT '{}';
