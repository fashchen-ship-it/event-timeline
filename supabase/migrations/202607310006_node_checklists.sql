create table public.node_checklist_items (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references public.event_nodes (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 240),
  is_completed boolean not null default false,
  position smallint not null default 0 check (position between 0 and 100),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index node_checklist_items_node_idx on public.node_checklist_items (node_id, position);

create or replace function public.validate_node_checklist_item_owner()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from public.event_nodes
    where id = new.node_id and event_id = new.event_id and user_id = new.user_id
  ) then
    raise exception 'Checklist item must belong to the node owner';
  end if;
  return new;
end;
$$;

create trigger validate_node_checklist_item_owner
  before insert or update on public.node_checklist_items
  for each row execute procedure public.validate_node_checklist_item_owner();

create trigger set_node_checklist_items_updated_at
  before update on public.node_checklist_items
  for each row execute procedure public.set_updated_at();

alter table public.node_checklist_items enable row level security;

create policy "Users manage their own node checklist items"
  on public.node_checklist_items for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
