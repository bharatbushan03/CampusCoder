-- Add archive fields to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS summary text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS recording_url text;

-- Create Resources table
CREATE TABLE IF NOT EXISTS public.resources (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    link text NOT NULL,
    category text NOT NULL, -- roadmaps, practice, dsa, placement, general
    event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can view active resources" ON public.resources FOR SELECT USING (is_active = true);
CREATE POLICY "Admins have full access to resources" ON public.resources FOR ALL USING (public.is_admin_or_organizer());
