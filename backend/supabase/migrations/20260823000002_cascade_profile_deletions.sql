-- Automatically delete auth.users record when a profile is deleted from public.profiles
create or replace function public.handle_deleted_profile()
returns trigger as $$
begin
    delete from auth.users where id = old.id;
    return old;
end;
$$ language plpgsql security definer;

-- Trigger on public.profiles delete
drop trigger if exists on_profile_deleted on public.profiles;
create trigger on_profile_deleted
    after delete on public.profiles
    for each row execute procedure public.handle_deleted_profile();
