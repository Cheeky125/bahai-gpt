-- Phoenix — search function v2: adds a "kind" filter (e.g. only prayers) and an exact-phrase boost.
drop function if exists public.search_passages(text, extensions.halfvec, int, text, boolean, float, float, int);
drop function if exists public.search_passages(text, extensions.halfvec, int, text, boolean, float, float, int, text);

create or replace function public.search_passages(
  query_text        text,
  query_embedding   extensions.halfvec(1024),
  match_count       int     default 10,
  author_filter     text    default null,
  include_editorial boolean default false,
  keyword_weight    float   default 1.0,
  meaning_weight    float   default 1.0,
  rrf_k             int     default 50,
  kind_filter       text    default null
)
returns table (
  id text, book text, author text, section text, para text, citation text,
  on_behalf boolean, url text, text text, kind text, score float
)
language sql stable
set search_path = public, extensions
as $$
  with q as (
    select websearch_to_tsquery('english', public.phoenix_norm(query_text)) as tsq,
           phraseto_tsquery('english', public.phoenix_norm(query_text))    as psq
  ),
  base as (
    select p.* from public.passages p
    where (author_filter is null or p.author = author_filter)
      and (kind_filter is null or p.kind = kind_filter)
      and (include_editorial or not p.editorial)
  ),
  keyword as (
    select b.id, row_number() over (order by ts_rank_cd(b.fts, q.tsq) desc) as rank_ix
    from base b, q
    where b.fts @@ q.tsq
    order by rank_ix
    limit least(match_count, 50) * 3
  ),
  meaning as (
    select b.id, row_number() over (order by b.embedding <=> query_embedding) as rank_ix
    from base b
    where b.embedding is not null
    order by b.embedding <=> query_embedding
    limit least(match_count, 50) * 3
  ),
  phrase as (
    select b.id
    from base b, q
    where numnode(q.psq) >= 3 and b.fts @@ q.psq
    limit 20
  ),
  cand as (
    select id from keyword union select id from meaning union select id from phrase
  )
  select p.id, p.book, p.author, p.section, p.para, p.citation, p.on_behalf, p.url, p.text, p.kind,
         coalesce(1.0 / (rrf_k + k.rank_ix), 0) * keyword_weight
       + coalesce(1.0 / (rrf_k + m.rank_ix), 0) * meaning_weight
       + case when ph.id is not null then 0.05 else 0 end as score
  from cand c
  join public.passages p on p.id = c.id
  left join keyword k on k.id = c.id
  left join meaning m on m.id = c.id
  left join phrase ph on ph.id = c.id
  order by score desc
  limit least(match_count, 50);
$$;
