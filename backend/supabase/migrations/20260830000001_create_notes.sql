-- Create Notes Table for Dynamic PDF Notes and Academic Syllabus Management
CREATE TABLE IF NOT EXISTS public.notes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    code text NOT NULL,
    subject text,
    year text NOT NULL DEFAULT '1st-year', -- 1st-year, 2nd-year, 3rd-year, 4th-year
    semester text NOT NULL DEFAULT 'sem-1', -- sem-1, sem-2, sem-3, sem-4, etc.
    branch text DEFAULT 'All Branches',
    description text,
    pdf_url text NOT NULL,
    file_size text DEFAULT 'PDF Document',
    page_count integer,
    author text DEFAULT 'CampusCoder Academic Team',
    tags text[] DEFAULT '{}',
    topics jsonb DEFAULT '[]'::jsonb,
    highlights text[] DEFAULT '{}',
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can view active notes" ON public.notes FOR SELECT USING (is_active = true);
CREATE POLICY "Admins have full access to notes" ON public.notes FOR ALL USING (public.is_admin_or_organizer());
