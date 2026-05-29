-- Create SQL migration for CampusCoder Database Schema
-- Location: supabase/migrations/20260529000000_init_schema.sql

-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- 1. Create Profiles Table (linked to auth.users)
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    full_name text,
    email text,
    role text not null check (role in ('student', 'admin', 'organizer')) default 'student',
    college text,
    branch text,
    year text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Profiles
alter table public.profiles enable row level security;

-- 2. Create Events Table
create table public.events (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    slug text unique not null,
    short_description text,
    full_description text,
    event_type text not null check (event_type in ('workshop', 'coding_session', 'orientation', 'challenge', 'webinar')) default 'workshop',
    mode text not null check (mode in ('online', 'offline', 'hybrid')) default 'online',
    date date not null,
    start_time time without time zone not null,
    end_time time without time zone not null,
    meeting_link text,
    registration_deadline timestamp with time zone,
    banner_url text,
    status text not null check (status in ('draft', 'published', 'completed', 'cancelled')) default 'draft',
    created_by uuid references auth.users on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Events
alter table public.events enable row level security;

-- 3. Create Event Owners Table (Speakers / Organizers for a specific event)
create table public.event_owners (
    id uuid default gen_random_uuid() primary key,
    event_id uuid references public.events on delete cascade not null,
    name text not null,
    role text,
    email text,
    bio text,
    profile_image_url text
);

-- Enable RLS on Event Owners
alter table public.event_owners enable row level security;

-- 4. Create Registrations Table (Student RSVPs)
create table public.registrations (
    id uuid default gen_random_uuid() primary key,
    event_id uuid references public.events on delete cascade not null,
    full_name text not null,
    email text not null,
    phone text,
    college text,
    branch text,
    year text,
    coding_level text,
    preferred_language text,
    reason_to_join text,
    registered_at timestamp with time zone default timezone('utc'::text, now()) not null,
    attendance_status text not null check (attendance_status in ('registered', 'attended', 'absent')) default 'registered'
);

-- Enable RLS on Registrations
alter table public.registrations enable row level security;

-- 5. Create Community Links Table (Discord, Slack, Github endpoints)
create table public.community_links (
    id uuid default gen_random_uuid() primary key,
    platform text not null,
    url text not null,
    is_active boolean default true not null
);

-- Enable RLS on Community Links
alter table public.community_links enable row level security;

-- 6. Create Announcements Table
create table public.announcements (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    message text not null,
    event_id uuid references public.events on delete cascade,
    is_active boolean default true not null,
    publish_date timestamp with time zone default timezone('utc'::text, now()) not null,
    created_by uuid references auth.users on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Announcements
alter table public.announcements enable row level security;


--------------------------------------------------------------------------------
-- DATABASE FUNCTIONS & TRIGGERS
--------------------------------------------------------------------------------

-- Trigger function to update updated_at timestamp on edit
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql security definer;

create trigger update_events_updated_at
    before update on public.events
    for each row execute procedure public.update_updated_at_column();

-- Function to check if a user is Admin or Organizer
create or replace function public.is_admin_or_organizer()
returns boolean as $$
begin
    return exists (
        select 1 from public.profiles
        where id = auth.uid()
        and role in ('admin', 'organizer')
    );
end;
$$ language plpgsql security definer;

-- Trigger to automatically create a Profile when a User signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, full_name, email, role, college, branch, year)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', ''),
        new.email,
        coalesce(new.raw_user_meta_data->>'role', 'student'),
        coalesce(new.raw_user_meta_data->>'college', ''),
        coalesce(new.raw_user_meta_data->>'branch', ''),
        coalesce(new.raw_user_meta_data->>'year', '')
    );
    return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();


--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
--------------------------------------------------------------------------------

-- A. Profiles Policies
create policy "Allow users to view their own profile"
    on public.profiles for select
    using (auth.uid() = id);

create policy "Allow admins/organizers to view all profiles"
    on public.profiles for select
    using (public.is_admin_or_organizer());

create policy "Allow users to edit their own profile details"
    on public.profiles for update
    using (auth.uid() = id)
    with check (auth.uid() = id);

create policy "Allow admins/organizers to update all profiles"
    on public.profiles for all
    using (public.is_admin_or_organizer());

-- B. Events Policies
create policy "Allow anyone to read published events"
    on public.events for select
    using (status = 'published');

create policy "Allow admins/organizers to view all events (including drafts)"
    on public.events for select
    using (public.is_admin_or_organizer());

create policy "Allow admins/organizers full access to events"
    on public.events for all
    using (public.is_admin_or_organizer());

-- C. Event Owners Policies
create policy "Allow anyone to read event owners details"
    on public.event_owners for select
    using (true);

create policy "Allow admins/organizers full access to event owners"
    on public.event_owners for all
    using (public.is_admin_or_organizer());

-- D. Registrations Policies
create policy "Allow public to register for events"
    on public.registrations for insert
    with check (true);

create policy "Allow admins/organizers to view registrations"
    on public.registrations for select
    using (public.is_admin_or_organizer());

create policy "Allow users to view registrations matching their email"
    on public.registrations for select
    using (email = auth.jwt()->>'email');

create policy "Allow admins/organizers full access to registrations"
    on public.registrations for all
    using (public.is_admin_or_organizer());

-- E. Community Links Policies
create policy "Allow anyone to view active community links"
    on public.community_links for select
    using (is_active = true);

create policy "Allow admins/organizers full access to community links"
    on public.community_links for all
    using (public.is_admin_or_organizer());

-- F. Announcements Policies
create policy "Allow public to view announcements"
    on public.announcements for select
    using (true);

create policy "Allow admins/organizers full access to announcements"
    on public.announcements for all
    using (public.is_admin_or_organizer());
