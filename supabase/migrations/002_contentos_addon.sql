-- ContentOS Addon Migration
-- SAFE: Only adds NEW columns/tables to existing schema. No drops, no recreates.
-- Run this AFTER your existing schema is already in place.

-- =============================================
-- 1. Add ContentOS columns to existing profiles
-- =============================================
alter table profiles add column if not exists credits_remaining integer default 0;
alter table profiles add column if not exists plan text default 'free';
alter table profiles add column if not exists onboarding_completed boolean default false;

-- =============================================
-- 2. Add user_id to ContentOS tables (videos, content_ideas, assets, hooks)
--    These tables already exist from 001_content_os.sql
-- =============================================
alter table videos add column if not exists user_id uuid references auth.users(id);
alter table content_ideas add column if not exists user_id uuid references auth.users(id);
alter table assets add column if not exists user_id uuid references auth.users(id);
alter table hooks add column if not exists user_id uuid references auth.users(id);

-- Indexes for user_id lookups
create index if not exists idx_videos_user_id on videos(user_id);
create index if not exists idx_content_ideas_user_id on content_ideas(user_id);
create index if not exists idx_assets_user_id on assets(user_id);
create index if not exists idx_hooks_user_id on hooks(user_id);

-- =============================================
-- 3. RLS policies for ContentOS tables (additive, does NOT drop existing policies)
-- =============================================

-- Videos: user-scoped access
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users manage own videos' and tablename = 'videos') then
    create policy "Users manage own videos"
      on videos for all using (user_id = auth.uid() or user_id is null)
      with check (user_id = auth.uid() or user_id is null);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Admins manage all videos' and tablename = 'videos') then
    create policy "Admins manage all videos"
      on videos for all using (
        exists (select 1 from profiles where id = auth.uid() and rol = 'admin')
      );
  end if;
end $$;

-- Content ideas: user-scoped access
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users manage own ideas' and tablename = 'content_ideas') then
    create policy "Users manage own ideas"
      on content_ideas for all using (user_id = auth.uid() or user_id is null)
      with check (user_id = auth.uid() or user_id is null);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Admins manage all ideas' and tablename = 'content_ideas') then
    create policy "Admins manage all ideas"
      on content_ideas for all using (
        exists (select 1 from profiles where id = auth.uid() and rol = 'admin')
      );
  end if;
end $$;

-- Assets: user-scoped access
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users manage own assets' and tablename = 'assets') then
    create policy "Users manage own assets"
      on assets for all using (user_id = auth.uid() or user_id is null)
      with check (user_id = auth.uid() or user_id is null);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Admins manage all assets' and tablename = 'assets') then
    create policy "Admins manage all assets"
      on assets for all using (
        exists (select 1 from profiles where id = auth.uid() and rol = 'admin')
      );
  end if;
end $$;

-- Hooks: user-scoped access
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users manage own hooks' and tablename = 'hooks') then
    create policy "Users manage own hooks"
      on hooks for all using (user_id = auth.uid() or user_id is null)
      with check (user_id = auth.uid() or user_id is null);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Admins manage all hooks' and tablename = 'hooks') then
    create policy "Admins manage all hooks"
      on hooks for all using (
        exists (select 1 from profiles where id = auth.uid() and rol = 'admin')
      );
  end if;
end $$;

-- =============================================
-- 4. Updated_at trigger function (safe: create or replace)
-- =============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add trigger to videos if not exists
do $$ begin
  if not exists (select 1 from information_schema.triggers where trigger_name = 'videos_updated_at' and event_object_table = 'videos') then
    create trigger videos_updated_at
      before update on videos
      for each row execute function update_updated_at();
  end if;
end $$;
