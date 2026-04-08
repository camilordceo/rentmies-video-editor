-- ContentOS Database Schema
-- Videos, Content Ideas, Assets, and Hooks

-- Videos produced
create table if not exists videos (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  transcript text,
  composition_type text check (
    composition_type in ('skill-breakdown','talking-head','hook-card')
  ),
  grade text check (grade in ('iphone','cinematic','warm','raw')),
  status text default 'draft' check (
    status in ('draft','rendered','published','archived')
  ),
  output_url text,
  thumbnail_url text,
  duration_seconds integer,
  props jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Content ideas (daily recommendations)
create table if not exists content_ideas (
  id uuid default gen_random_uuid() primary key,
  date date default current_date,
  hook_text text not null,
  hook_type text check (
    hook_type in ('stat','story','contrarian','list','question','transformation')
  ),
  angle text,
  composition_suggestion text,
  youtube_references text[],
  score integer default 0,
  status text default 'pending' check (
    status in ('pending','approved','rejected','produced')
  ),
  notes text,
  created_at timestamptz default now()
);

-- Assets (images, screenshots, b-roll)
create table if not exists assets (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text check (type in ('screenshot','logo','background','broll')),
  storage_path text not null,
  public_url text,
  tags text[],
  created_at timestamptz default now()
);

-- Hooks generated per video
create table if not exists hooks (
  id uuid default gen_random_uuid() primary key,
  video_id uuid references videos(id) on delete cascade,
  idea_id uuid references content_ideas(id) on delete set null,
  hook_text text not null,
  hook_type text,
  score integer,
  selected boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
alter table videos enable row level security;
alter table content_ideas enable row level security;
alter table assets enable row level security;
alter table hooks enable row level security;

-- Allow anon read/write for now (single-user app)
create policy "Allow all on videos" on videos for all using (true) with check (true);
create policy "Allow all on content_ideas" on content_ideas for all using (true) with check (true);
create policy "Allow all on assets" on assets for all using (true) with check (true);
create policy "Allow all on hooks" on hooks for all using (true) with check (true);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger videos_updated_at
  before update on videos
  for each row execute function update_updated_at();
