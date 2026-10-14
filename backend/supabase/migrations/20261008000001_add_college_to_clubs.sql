-- Add college column to clubs table so each club/community can be associated with a specific college
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS college TEXT DEFAULT 'MIET';

-- Set all existing clubs to MIET (the default campus)
UPDATE public.clubs SET college = 'MIET' WHERE college IS NULL;

-- Index for fast filtering by college
CREATE INDEX IF NOT EXISTS idx_clubs_college ON public.clubs(college);
