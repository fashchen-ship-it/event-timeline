create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text check (char_length(description) <= 1000),
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'archived')),
  start_date date not null default current_date,
  cover_url text,
  icon text check (char_length(icon) <= 16),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id)
);

create table public.event_nodes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null,
  user_id uuid not null,
  title text not null check (char_length(title) between 1 and 160),
  content text check (char_length(content) <= 10000),
  event_date date not null,
  event_time time,
  is_important boolean not null default false,
  link_url text check (char_length(link_url) <= 2048),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id),
  foreign key (event_id, user_id) references public.events (id, user_id) on delete cascade
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null,
  user_id uuid not null,
  file_name text not null check (char_length(file_name) <= 255),
  file_url text not null,
  storage_path text not null unique,
  file_type text not null,
  file_size bigint not null check (file_size > 0 and file_size <= 10485760),
  created_at timestamptz not null default timezone('utc', now()),
  foreign key (node_id, user_id) references public.event_nodes (id, user_id) on delete cascade
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 30),
  created_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id),
  unique (user_id, name)
);

create table public.event_tags (
  event_id uuid not null,
  tag_id uuid not null,
  user_id uuid not null,
  primary key (event_id, tag_id),
  foreign key (event_id, user_id) references public.events (id, user_id) on delete cascade,
  foreign key (tag_id, user_id) references public.tags (id, user_id) on delete cascade
);

create table public.node_tags (
  node_id uuid not null,
  tag_id uuid not null,
  user_id uuid not null,
  primary key (node_id, tag_id),
  foreign key (node_id, user_id) references public.event_nodes (id, user_id) on delete cascade,
  foreign key (tag_id, user_id) references public.tags (id, user_id) on delete cascade
);

create index events_user_status_updated_at_idx on public.events (user_id, status, updated_at desc);
create index event_nodes_event_date_time_idx on public.event_nodes (event_id, event_date desc, event_time desc nulls last);
create index event_nodes_user_date_idx on public.event_nodes (user_id, event_date desc, event_time desc nulls last);
create index attachments_node_id_idx on public.attachments (node_id);
create index event_tags_tag_id_idx on public.event_tags (tag_id);
create index node_tags_tag_id_idx on public.node_tags (tag_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger set_events_updated_at
  before update on public.events
  for each row execute procedure public.set_updated_at();

create trigger set_event_nodes_updated_at
  before update on public.event_nodes
  for each row execute procedure public.set_updated_at();

alter table public.events enable row level security;
alter table public.event_nodes enable row level security;
alter table public.attachments enable row level security;
alter table public.tags enable row level security;
alter table public.event_tags enable row level security;
alter table public.node_tags enable row level security;

create policy "Users manage their own events"
  on public.events for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own nodes"
  on public.event_nodes for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own attachments"
  on public.attachments for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own tags"
  on public.tags for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own event tags"
  on public.event_tags for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own node tags"
  on public.node_tags for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'timeline-files',
  'timeline-files',
  false,
  10485760,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf', 'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do nothing;

create policy "Users access their own timeline files"
  on storage.objects for all to authenticated
  using (bucket_id = 'timeline-files' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'timeline-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
