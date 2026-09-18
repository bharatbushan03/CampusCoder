-- Create Note Folders Table for Google Drive-style Subject Organization
CREATE TABLE IF NOT EXISTS public.note_folders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_code text NOT NULL,
    name text NOT NULL,
    parent_id uuid REFERENCES public.note_folders(id) ON DELETE CASCADE,
    color text DEFAULT 'blue',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add folder references to notes
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.note_folders(id) ON DELETE SET NULL;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS folder_name text;

-- Create index for faster folder lookups
CREATE INDEX IF NOT EXISTS idx_note_folders_subject ON public.note_folders(subject_code);
CREATE INDEX IF NOT EXISTS idx_note_folders_parent ON public.note_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_notes_folder_id ON public.notes(folder_id);

-- Enable RLS
ALTER TABLE public.note_folders ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can view note folders" ON public.note_folders FOR SELECT USING (true);
CREATE POLICY "Admins have full access to note folders" ON public.note_folders FOR ALL USING (public.is_admin_or_organizer());
