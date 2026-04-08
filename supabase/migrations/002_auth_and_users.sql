-- Profiles table linked to Supabase Auth
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  display_name text,
  avatar_url text,
  role text default 'user' check (role in ('user', 'admin')),
  credits_remaining integer default 0,
  plan text default 'free' check (plan in ('free', 'starter', 'pro', 'enterprise')),
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at trigger for profiles
create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- RLS for profiles
alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Admins can view all profiles"
  on profiles for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Add user_id to existing tables
alter table videos add column if not exists user_id uuid references profiles(id);
alter table content_ideas add column if not exists user_id uuid references profiles(id);
alter table assets add column if not exists user_id uuid references profiles(id);
alter table hooks add column if not exists user_id uuid references profiles(id);

-- Drop old wide-open policies
drop policy if exists "Allow all on videos" on videos;
drop policy if exists "Allow all on content_ideas" on content_ideas;
drop policy if exists "Allow all on assets" on assets;
drop policy if exists "Allow all on hooks" on hooks;

-- New scoped policies for videos
create policy "Users manage own videos"
  on videos for all using (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid() or user_id is null);

create policy "Admins manage all videos"
  on videos for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- New scoped policies for content_ideas
create policy "Users manage own ideas"
  on content_ideas for all using (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid() or user_id is null);

create policy "Admins manage all ideas"
  on content_ideas for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- New scoped policies for assets
create policy "Users manage own assets"
  on assets for all using (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid() or user_id is null);

create policy "Admins manage all assets"
  on assets for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- New scoped policies for hooks
create policy "Users manage own hooks"
  on hooks for all using (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid() or user_id is null);

create policy "Admins manage all hooks"
  on hooks for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Index on user_id for performance
create index if not exists idx_videos_user_id on videos(user_id);
create index if not exists idx_content_ideas_user_id on content_ideas(user_id);
create index if not exists idx_assets_user_id on assets(user_id);
create index if not exists idx_hooks_user_id on hooks(user_id);
