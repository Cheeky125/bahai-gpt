-- Phoenix — database setup
-- Paste this whole file into Supabase → SQL Editor → New query, then click Run. Safe to run more than once.

create schema if not exists extensions;
create extension if not exists vector with schema extensions;
create extension if not exists unaccent with schema extensions;
set search_path = public, extensions;

-- Lower-case, strip accents and curly quotes so "Bahaullah", "Baha'u'llah" and "Bahá’u’lláh" all match.
create or replace function public.phoenix_norm(t text)
returns text language sql immutable parallel safe as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary,
         replace(replace(replace(replace(coalesce(t, ''), '’', ''), '‘', ''), '''', ''), '‑', '-')))
$$;

create table if not exists public.passages (
  id           text primary key,
  book         text not null,
  book_slug    text not null,
  author       text,
  kind         text,
  section      text,
  subheading   text,
  para         text,
  citation     text,
  on_behalf    boolean default false,
  editorial    boolean default false,
  url          text,
  message_date date,
  text         text not null,
  embedding    extensions.halfvec(1024),
  fts          tsvector generated always as (to_tsvector('english', public.phoenix_norm(text))) stored
);

create index if not exists passages_fts_idx    on public.passages using gin (fts);
create index if not exists passages_author_idx on public.passages (author);
create index if not exists passages_book_idx   on public.passages (book_slug);
create index if not exists passages_vec_idx    on public.passages using hnsw (embedding extensions.halfvec_cosine_ops);

-- Anyone may read the passages (the website only reads); only your secret key can write.
alter table public.passages enable row level security;
drop policy if exists "passages are public to read" on public.passages;
create policy "passages are public to read" on public.passages for select using (true);

-- Hybrid search: keyword matches + meaning matches, combined (reciprocal rank fusion).
create or replace function public.search_passages(
  query_text       text,
  query_embedding  extensions.halfvec(1024),
  match_count      int     default 10,
  author_filter    text    default null,
  include_editorial boolean default false,
  keyword_weight   float   default 1.0,
  meaning_weight   float   default 1.0,
  rrf_k            int     default 50
)
returns table (
  id text, book text, author text, section text, para text, citation text,
  on_behalf boolean, url text, text text, score float
)
language sql stable
set search_path = public, extensions
as $$
  with q as (
    select websearch_to_tsquery('english', public.phoenix_norm(query_text)) as tsq
  ),
  keyword as (
    select p.id,
           row_number() over (order by ts_rank_cd(p.fts, q.tsq) desc) as rank_ix
    from public.passages p, q
    where p.fts @@ q.tsq
      and (author_filter is null or p.author = author_filter)
      and (include_editorial or not p.editorial)
    order by rank_ix
    limit least(match_count, 50) * 2
  ),
  meaning as (
    select p.id,
           row_number() over (order by p.embedding <=> query_embedding) as rank_ix
    from public.passages p
    where p.embedding is not null
      and (author_filter is null or p.author = author_filter)
      and (include_editorial or not p.editorial)
    order by p.embedding <=> query_embedding
    limit least(match_count, 50) * 2
  )
  select p.id, p.book, p.author, p.section, p.para, p.citation, p.on_behalf, p.url, p.text,
         coalesce(1.0 / (rrf_k + k.rank_ix), 0) * keyword_weight
       + coalesce(1.0 / (rrf_k + m.rank_ix), 0) * meaning_weight as score
  from keyword k
  full outer join meaning m on k.id = m.id
  join public.passages p on p.id = coalesce(k.id, m.id)
  order by score desc
  limit least(match_count, 50);
$$;
