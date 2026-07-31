create extension if not exists pg_trgm;

create index events_title_trgm_idx on public.events using gin (title gin_trgm_ops);
create index events_description_trgm_idx on public.events using gin (description gin_trgm_ops);
create index event_nodes_title_trgm_idx on public.event_nodes using gin (title gin_trgm_ops);
create index event_nodes_content_trgm_idx on public.event_nodes using gin (content gin_trgm_ops);
create index tags_name_trgm_idx on public.tags using gin (name gin_trgm_ops);

create or replace function public.search_timeline(
  p_query text default null,
  p_status text default null,
  p_tag text default null,
  p_date_from date default null,
  p_date_to date default null,
  p_important boolean default null
)
returns table (
  result_type text,
  event_id uuid,
  node_id uuid,
  title text,
  excerpt text,
  event_title text,
  result_date date,
  is_important boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  with search_input as (
    select nullif(trim(p_query), '') as value
  )
  select
    'event'::text as result_type,
    e.id as event_id,
    null::uuid as node_id,
    e.title,
    coalesce(e.description, '') as excerpt,
    e.title as event_title,
    e.start_date as result_date,
    false as is_important
  from public.events e
  cross join search_input q
  where e.user_id = (select auth.uid())
    and e.status <> 'archived'
    and (p_status is null or e.status = p_status)
    and (p_date_from is null or e.start_date >= p_date_from)
    and (p_date_to is null or e.start_date <= p_date_to)
    and p_important is not true
    and (
      q.value is null
      or e.title ilike '%' || q.value || '%'
      or coalesce(e.description, '') ilike '%' || q.value || '%'
      or exists (
        select 1 from public.event_tags et
        join public.tags t on t.id = et.tag_id
        where et.event_id = e.id and t.name ilike '%' || q.value || '%'
      )
    )
    and (
      p_tag is null or exists (
        select 1 from public.event_tags et
        join public.tags t on t.id = et.tag_id
        where et.event_id = e.id and t.name = p_tag
      )
    )

  union all

  select
    'node'::text as result_type,
    n.event_id,
    n.id as node_id,
    n.title,
    coalesce(n.content, '') as excerpt,
    e.title as event_title,
    n.event_date as result_date,
    n.is_important
  from public.event_nodes n
  join public.events e on e.id = n.event_id
  cross join search_input q
  where n.user_id = (select auth.uid())
    and e.status <> 'archived'
    and (p_status is null or e.status = p_status)
    and (p_date_from is null or n.event_date >= p_date_from)
    and (p_date_to is null or n.event_date <= p_date_to)
    and (p_important is null or n.is_important = p_important)
    and (
      q.value is null
      or n.title ilike '%' || q.value || '%'
      or coalesce(n.content, '') ilike '%' || q.value || '%'
      or exists (
        select 1 from public.node_tags nt
        join public.tags t on t.id = nt.tag_id
        where nt.node_id = n.id and t.name ilike '%' || q.value || '%'
      )
      or exists (
        select 1 from public.event_tags et
        join public.tags t on t.id = et.tag_id
        where et.event_id = e.id and t.name ilike '%' || q.value || '%'
      )
    )
    and (
      p_tag is null or exists (
        select 1 from public.node_tags nt
        join public.tags t on t.id = nt.tag_id
        where nt.node_id = n.id and t.name = p_tag
      ) or exists (
        select 1 from public.event_tags et
        join public.tags t on t.id = et.tag_id
        where et.event_id = e.id and t.name = p_tag
      )
    )
  order by result_date desc, result_type;
$$;

revoke all on function public.search_timeline(text, text, text, date, date, boolean) from public;
grant execute on function public.search_timeline(text, text, text, date, date, boolean) to authenticated;
