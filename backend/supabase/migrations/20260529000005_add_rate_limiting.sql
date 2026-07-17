-- Create Rate Limiting Table
create table public.rate_limits (
    key text primary key,
    last_attempt timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (though we'll likely access this via service role or admin client)
alter table public.rate_limits enable row level security;

-- Only admins can manage rate limits (usually managed by server)
create policy "Allow admins to manage rate limits"
    on public.rate_limits for all
    using (public.is_admin_or_organizer());
