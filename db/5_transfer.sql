-- Phoenix — move your saved items and streak to another phone with a short code. Run once in the Supabase SQL editor.
-- The website can't read this table directly: it only goes through the two functions below.
-- A code works once and only for 24 hours; then the copy is deleted.
create table if not exists public.transfers (
  code       text primary key,
  created_at timestamptz not null default now(),
  data       jsonb not null
);
alter table public.transfers enable row level security;   -- no policies: no direct access at all
revoke all on public.transfers from anon, authenticated;

-- Save a copy and get a code back (6 letters/numbers, no look-alikes like O/0 or I/1).
create or replace function public.phoenix_transfer_put(payload jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  c text;
  i int;
begin
  if payload is null or pg_column_size(payload) > 400000 then raise exception 'too large'; end if;
  delete from public.transfers where created_at < now() - interval '24 hours';
  loop
    c := '';
    for i in 1..6 loop c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1); end loop;
    begin
      insert into public.transfers (code, data) values (c, payload);
      return c;
    exception when unique_violation then null; -- code taken: try another
    end;
  end loop;
end $$;

-- Use a code: returns the copy once, then deletes it.
create or replace function public.phoenix_transfer_take(code_in text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare d jsonb;
begin
  delete from public.transfers
   where code = upper(regexp_replace(coalesce(code_in, ''), '[^A-Za-z0-9]', '', 'g'))
     and created_at >= now() - interval '24 hours'
  returning data into d;
  return d;
end $$;

revoke all on function public.phoenix_transfer_put(jsonb) from public;
revoke all on function public.phoenix_transfer_take(text) from public;
grant execute on function public.phoenix_transfer_put(jsonb) to anon;
grant execute on function public.phoenix_transfer_take(text) to anon;
