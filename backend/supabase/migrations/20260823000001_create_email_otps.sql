-- Create Email OTPs table for registration verification and session management
create table if not exists public.email_otps (
    id uuid default gen_random_uuid() primary key,
    email text not null,
    otp_code text not null,
    purpose text not null default 'signup',
    payload jsonb,
    expires_at timestamp with time zone not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_email_otps_email_purpose on public.email_otps(email, purpose);

-- Enable Row Level Security
alter table public.email_otps enable row level security;

-- Only service role / admin backend client has access to OTPs
create policy "Allow admins to manage email_otps"
    on public.email_otps for all
    using (public.is_admin_or_organizer());
