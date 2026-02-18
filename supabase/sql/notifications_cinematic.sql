-- 1) Notifications Table
create table if not exists public.notifications (
    id bigserial primary key,
    user_id uuid references auth.users not null,
    title text not null,
    body text not null,
    kind text not null,
    -- 'mission_claim', 'drop', 'discount', 'sorvetes_free', 'system'
    data jsonb default '{}'::jsonb,
    priority int default 1,
    -- 1=normal, 2=important, 3=cinematic/big win
    created_at timestamptz default now(),
    read_at timestamptz null
);
create index if not exists notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_user_read_idx on public.notifications (user_id, read_at);
alter table public.notifications enable row level security;
create policy "Users can view own notifications" on public.notifications for
select using (auth.uid() = user_id);
create policy "Users can update own notifications (mark read)" on public.notifications for
update using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- 2) Push Subscriptions
create table if not exists public.push_subscriptions (
    id bigserial primary key,
    user_id uuid references auth.users not null,
    endpoint text not null,
    p256dh text not null,
    auth text not null,
    user_agent text,
    created_at timestamptz default now(),
    last_seen_at timestamptz default now(),
    unique(user_id, endpoint)
);
alter table public.push_subscriptions enable row level security;
create policy "Users can manage own subscriptions" on public.push_subscriptions for all using (auth.uid() = user_id);
-- 3) Notification Preferences
create table if not exists public.notification_prefs (
    user_id uuid references auth.users primary key,
    drops boolean default true,
    missions boolean default true,
    discounts boolean default true,
    sorvetes_free boolean default true,
    push_enabled boolean default false,
    sound_enabled boolean default true,
    cinematic_enabled boolean default true
);
alter table public.notification_prefs enable row level security;
create policy "Users can view own prefs" on public.notification_prefs for
select using (auth.uid() = user_id);
create policy "Users can update own prefs" on public.notification_prefs for
update using (auth.uid() = user_id);
-- Trigger to create prefs on user creation (optional but good practice)
-- For now, we'll handle creation in the app or via a trigger on auth.users if needed.
-- Let's add a trigger to ensure prefs exist when a user is created
create or replace function public.handle_new_user_prefs() returns trigger as $$ begin
insert into public.notification_prefs (user_id)
values (new.id) on conflict (user_id) do nothing;
return new;
end;
$$ language plpgsql security definer;
-- Bind to auth.users if you have permissions, otherwise app logic will handle insert
-- drop trigger if exists on_auth_user_created_prefs on auth.users;
-- create trigger on_auth_user_created_prefs
--   after insert on auth.users
--   for each row execute procedure public.handle_new_user_prefs();