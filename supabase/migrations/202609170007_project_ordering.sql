alter table public.event_collections
  add column if not exists is_favorite boolean not null default false,
  add column if not exists position integer not null default 0;

with ranked_collections as (
  select id, row_number() over (partition by user_id order by created_at asc, id asc) as next_position
  from public.event_collections
)
update public.event_collections as collection
set position = ranked_collections.next_position
from ranked_collections
where collection.id = ranked_collections.id
  and collection.position = 0;

create index if not exists event_collections_user_order_idx
  on public.event_collections (user_id, is_favorite desc, position asc, name asc);
