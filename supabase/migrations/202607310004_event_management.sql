create table public.event_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 30),
  color text not null default '#8da77a' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, name)
);

alter table public.events
  add column collection_id uuid references public.event_collections (id) on delete set null,
  add column is_pinned boolean not null default false;

create table public.event_visits (
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  visited_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, event_id)
);

create index events_user_pinned_updated_idx on public.events (user_id, is_pinned desc, updated_at desc);
create index events_collection_id_idx on public.events (collection_id);
create index event_visits_user_visited_idx on public.event_visits (user_id, visited_at desc);

create or replace function public.validate_event_collection_owner()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.collection_id is not null and not exists (
    select 1 from public.event_collections c
    where c.id = new.collection_id and c.user_id = new.user_id
  ) then
    raise exception 'Collection must belong to the event owner';
  end if;
  return new;
end;
$$;

create trigger validate_event_collection_owner
  before insert or update of collection_id, user_id on public.events
  for each row execute procedure public.validate_event_collection_owner();

create trigger set_event_collections_updated_at
  before update on public.event_collections
  for each row execute procedure public.set_updated_at();

alter table public.event_collections enable row level security;
alter table public.event_visits enable row level security;

create policy "Users manage their own event collections"
  on public.event_collections for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own event visits"
  on public.event_visits for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
