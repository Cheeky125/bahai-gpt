-- Phoenix — anonymous click counts. Run once in the Supabase SQL editor.
-- The website can only ADD events. Nothing personal is stored: no names, no IP addresses, no search text —
-- just what was clicked (e.g. "sung_play"), a short detail (e.g. a theme name), the page, and a random
-- per-browser id so visitors can be counted without knowing who they are.
create table if not exists public.events (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name       text not null check (name ~ '^[a-z_]{2,40}$'),
  detail     text check (char_length(detail) <= 120),
  page       text check (char_length(page) <= 200),
  visitor    text check (char_length(visitor) <= 40)
);
create index if not exists events_created_at on public.events (created_at);
alter table public.events enable row level security;
drop policy if exists "anyone can add events" on public.events;
create policy "anyone can add events" on public.events for insert to anon with check (true);
grant insert on public.events to anon;

-- Totals only (never single rows), for the /stats page.
create or replace function public.phoenix_stats(days int default 7)
returns json
language sql
security definer
set search_path = public
as $$
  with e as (
    select * from public.events where created_at >= now() - make_interval(days => least(greatest(days, 1), 365))
  )
  select json_build_object(
    'days', least(greatest(days, 1), 365),
    'events', (select count(*) from e),
    'visitors', (select count(distinct visitor) from e),
    'by_day', coalesce((select json_agg(d order by d.day) from (
        select to_char(date_trunc('day', created_at at time zone 'America/Toronto'), 'YYYY-MM-DD') as day,
               count(*) as events, count(distinct visitor) as visitors
        from e group by 1) d), '[]'::json),
    'by_name', coalesce((select json_agg(n order by n.total desc) from (
        select name, count(*) as total, count(distinct visitor) as visitors from e group by name) n), '[]'::json),
    'top_details', coalesce((select json_agg(t order by t.name, t.total desc) from (
        select name, detail, total from (
          select name, detail, count(*) as total, row_number() over (partition by name order by count(*) desc) as rk
          from e where detail is not null and detail <> '' group by name, detail) x
        where rk <= 8) t), '[]'::json),
    'pages', coalesce((select json_agg(p order by p.total desc) from (
        select page, count(*) as total from e where page is not null group by page order by count(*) desc limit 12) p), '[]'::json),
    'feedback', (select count(*) from public.feedback where created_at >= now() - make_interval(days => least(greatest(days, 1), 365)))
  );
$$;
revoke all on function public.phoenix_stats(int) from public;
grant execute on function public.phoenix_stats(int) to anon;
