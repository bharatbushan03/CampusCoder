-- Create Competitions Table for Dynamic Competition Arena Management
CREATE TABLE IF NOT EXISTS public.competitions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    subtitle text,
    platform text NOT NULL,
    platform_url text NOT NULL,
    type text NOT NULL DEFAULT 'hackathon', -- hackathon, competitive-programming, ai-data, open-source, flagship
    difficulty text NOT NULL DEFAULT 'All Levels', -- Beginner, Intermediate, Advanced, All Levels
    prize_pool text,
    team_size text DEFAULT 'Solo or Team',
    mode text NOT NULL DEFAULT 'Online', -- Online, Hybrid, In-Person
    status text NOT NULL DEFAULT 'Upcoming', -- Live Now, Registration Open, Upcoming, Weekly Recurring, Annual Flagship, Concluded
    start_date timestamp with time zone,
    deadline_date text NOT NULL,
    target_date timestamp with time zone NOT NULL,
    concluded_date text,
    description text,
    tags text[] DEFAULT '{}',
    banner_gradient text DEFAULT 'from-emerald-500/20 via-teal-500/20 to-cyan-500/20',
    perks text[] DEFAULT '{}',
    eligibility text DEFAULT 'Open to all students and developers',
    timeline jsonb DEFAULT '[]'::jsonb,
    prep_kit jsonb DEFAULT '[]'::jsonb,
    checklist text[] DEFAULT '{}',
    featured boolean DEFAULT false,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can view active competitions" ON public.competitions FOR SELECT USING (is_active = true);
CREATE POLICY "Admins have full access to competitions" ON public.competitions FOR ALL USING (public.is_admin_or_organizer());
