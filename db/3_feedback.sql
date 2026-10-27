-- Phoenix — feedback table. Run once in the Supabase SQL editor.
-- Visitors can only ADD feedback (through the website); nobody can read it except you in the Supabase dashboard.
create table if not exists public.feedback (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  message    text not null check (char_length(message) between 2 and 3000),
  page       text check (char_length(page) <= 500),
  query      text check (char_length(query) <= 300),
  contact    text check (char_length(contact) <= 200)
);
alter table public.feedback enable row level security;
drop policy if exists "anyone can send feedback" on public.feedback;
create policy "anyone can send feedback" on public.feedback for insert to anon with check (true);
-- no select/update/delete policies: feedback can't be read or changed through the website
grant insert on public.feedback to anon;
