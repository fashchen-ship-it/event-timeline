create table public.event_references (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  source_event_id uuid not null references public.events (id) on delete cascade,
  source_node_id uuid references public.event_nodes (id) on delete cascade,
  target_event_id uuid not null references public.events (id) on delete cascade,
  target_node_id uuid references public.event_nodes (id) on delete cascade,
  note text check (char_length(note) <= 300),
  created_at timestamptz not null default timezone('utc', now()),
  check (source_event_id <> target_event_id or source_node_id is not null or target_node_id is not null)
);

create index event_references_source_idx on public.event_references (user_id, source_event_id, source_node_id);
create index event_references_target_idx on public.event_references (user_id, target_event_id, target_node_id);

create or replace function public.validate_event_reference_owner()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.events where id = new.source_event_id and user_id = new.user_id) then
    raise exception 'Source event must belong to the reference owner';
  end if;
  if not exists (select 1 from public.events where id = new.target_event_id and user_id = new.user_id) then
    raise exception 'Target event must belong to the reference owner';
  end if;
  if new.source_node_id is not null and not exists (
    select 1 from public.event_nodes where id = new.source_node_id and event_id = new.source_event_id and user_id = new.user_id
  ) then
    raise exception 'Source node must belong to the source event owner';
  end if;
  if new.target_node_id is not null and not exists (
    select 1 from public.event_nodes where id = new.target_node_id and event_id = new.target_event_id and user_id = new.user_id
  ) then
    raise exception 'Target node must belong to the target event owner';
  end if;
  return new;
end;
$$;

create trigger validate_event_reference_owner
  before insert or update on public.event_references
  for each row execute procedure public.validate_event_reference_owner();

alter table public.event_references enable row level security;

create policy "Users manage their own event references"
  on public.event_references for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
