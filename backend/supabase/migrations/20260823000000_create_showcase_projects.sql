-- Create Showcase Projects Table
-- Location: backend/supabase/migrations/20260823000000_create_showcase_projects.sql

create table if not exists public.showcase_projects (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    tagline text not null,
    description text not null,
    tech_stack text[] not null default '{}',
    category text not null default 'Web App',
    github_url text,
    live_url text,
    demo_video_url text,
    author_id uuid references auth.users on delete set null,
    author_name text not null,
    author_email text,
    author_college text,
    author_branch text,
    author_year text,
    stars integer not null default 0,
    featured boolean not null default false,
    status text not null check (status in ('pending', 'approved', 'rejected')) default 'approved',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.showcase_projects enable row level security;

-- Policy 1: Allow public read access to showcase projects
create policy "Allow public read access to showcase projects"
    on public.showcase_projects
    for select
    using (true);

-- Policy 2: Allow authenticated students to submit showcase projects
create policy "Allow authenticated students to submit showcase projects"
    on public.showcase_projects
    for insert
    to authenticated
    with check (true);

-- Policy 3: Allow authors to update their own showcase projects
create policy "Allow authors to update own showcase projects"
    on public.showcase_projects
    for update
    to authenticated
    using (auth.uid() = author_id)
    with check (auth.uid() = author_id);

-- Policy 4: Allow admins & organizers full access
create policy "Allow admins and organizers full control on showcase projects"
    on public.showcase_projects
    for all
    to authenticated
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role in ('admin', 'organizer')
        )
    );
