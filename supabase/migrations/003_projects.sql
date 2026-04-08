-- Projects table for persistent project storage
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  description text default '',
  aspect_ratio text default '16:9' check (aspect_ratio in ('16:9', '9:16', '1:1', '4:5')),
  fps integer default 30,
  scenes jsonb not null default '[]'::jsonb,
  template_id text,
  status text default 'draft' check (status in ('draft', 'rendering', 'completed', 'error')),
  output_url text,
  thumbnail_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table projects enable row level security;

create policy "Users manage own projects"
  on projects for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Admins manage all projects"
  on projects for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Indexes
create index if not exists idx_projects_user_id on projects(user_id);
create index if not exists idx_projects_status on projects(status);

-- Updated_at trigger
create trigger projects_updated_at
  before update on projects
  for each row execute function update_updated_at();
