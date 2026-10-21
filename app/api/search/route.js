// Phoenix search API.
// 1. (optional, needs ANTHROPIC_API_KEY) Claude reads the question and suggests better search wording,
//    whether it's a simple fact question, and whether the person wants prayers.
// 2. Every search wording is embedded with Voyage and run through the hybrid search in Supabase.
// 3. Results are merged, duplicates removed (the same passage quoted in several compilations), best first.
// 4. (optional) For fact questions, Claude writes a 1–2 sentence answer using ONLY the passages found,
//    citing them by number. Passages themselves are always shown verbatim.

import { matchFact } from "./facts";

export const runtime = "nodejs";
export const maxDuration = 30;

const AUTHORS = new Set(["Bahá’u’lláh", "The Báb", "‘Abdu’l-Bahá", "Shoghi Effendi", "The Universal House of Justice"]);
const MODEL = "claude-haiku-5-5";
// When the same words appear in several places, show the primary source first.
const KIND_RANK = { writings: 0, prayers: 0, talks: 1, messages: 2, compilation: 3 };

const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 30;
}

async function claude(system, user, maxTokens = 400) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
  });
  if (!r.ok) { console.error("claude", r.status, (await r.text()).slice(0, 300)); return null; }
  const j = await r.json();
  if (j.stop_reason === "max_tokens") console.error("claude output cut off", j.usage);
  return (j.content || []).map((c) => c.text || "").join("").trim();
}

function parseJson(s) {
  if (!s) return null;
  const m = s.match(/\{[\s\S]*\}/);
  try { return m ? JSON.parse(m[0]) : null; } catch { return null; }
}

const PLAN_SYSTEM = `You help search a database of paragraphs from the Bahá'í Writings (Bahá'u'lláh, the Báb, 'Abdu'l-Bahá, Shoghi Effendi, the Universal House of Justice, Bahá'í Prayers, and compilations). Given a user's question, reply with ONLY a JSON object:
{"type": "fact" | "topic" | "prayer" | "quote",
 "queries": [2 or 3 short search phrasings that would match how the Writings themselves word it — use the Writings' own vocabulary, e.g. "wine and intoxicating drinks" for alcohol, "progressive revelation" for why are there many religions; keep proper names],
 "prayers_only": true | false}
type "fact" = a question with a short factual answer (who, when, where, how old, how many, what is X). "quote" = the user is looking for a known phrase. "prayer" = the user wants a prayer. "topic" = anything else. prayers_only is true only when they ask for a prayer.`;

async function plan(q) {
  const fallback = { type: /\bprayers?\b/i.test(q) ? "prayer" : "topic", queries: [], prayers_only: /\bprayers?\b/i.test(q) };
  const out = parseJson(await claude(PLAN_SYSTEM, q, 1500));
  if (!out) return fallback;
  return {
    type: ["fact", "topic", "prayer", "quote"].includes(out.type) ? out.type : "topic",
    queries: Array.isArray(out.queries) ? out.queries.filter((x) => typeof x === "string" && x.trim()).slice(0, 3) : [],
    prayers_only: !!out.prayers_only,
  };
}

async function embed(texts) {
  const r = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ input: texts, model: "voyage-4", input_type: "query", output_dimension: 1024 }),
  });
  if (!r.ok) throw new Error(`embedding failed (${r.status})`);
  const j = await r.json();
  return j.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

async function search(q, emb, author, kind, count) {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  const headers = { apikey: key, "Content-Type": "application/json" };
  if (key && key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/search_passages`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query_text: q, query_embedding: `[${emb.join(",")}]`, match_count: count, author_filter: author || null, kind_filter: kind || null }),
  });
  if (!r.ok) throw new Error(`search failed (${r.status}): ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

async function byIds(ids) {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  const headers = { apikey: key };
  if (key && key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  const cols = "id,book,author,section,para,citation,on_behalf,url,text,kind";
  const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/passages?select=${cols}&id=in.(${ids.map(encodeURIComponent).join(",")})`, { headers });
  if (!r.ok) throw new Error(`fact lookup failed (${r.status})`);
  const rows = await r.json();
  return ids.map((id) => rows.find((x) => x.id === id)).filter(Boolean);
}

const norm = (t) => t.toLowerCase().replace(/[^a-zÀ-ɏ]+/g, " ").trim().slice(0, 140);

function merge(lists) {
  // Reciprocal-rank merge across the different search wordings, then drop repeated passages.
  const score = new Map(), row = new Map();
  lists.forEach((rows, li) => rows.forEach((r, i) => {
    score.set(r.id, (score.get(r.id) || 0) + 1 / (20 + i) * (li === 0 ? 1.2 : 1));
    if (!row.has(r.id)) row.set(r.id, r);
  }));
  const ranked = [...row.values()].sort((a, b) => score.get(b.id) - score.get(a.id));
  const seen = new Map();
  for (const r of ranked) {
    const k = norm(r.text);
    const prev = seen.get(k);
    if (!prev) seen.set(k, r);
    else if ((KIND_RANK[r.kind] ?? 9) < (KIND_RANK[prev.kind] ?? 9)) seen.set(k, { ...r, _pos: prev._pos });
  }
  return [...seen.values()];
}

const ANSWER_SYSTEM = `You answer short factual questions about the Bahá'í Faith using ONLY the numbered passages provided. Rules:
- Answer in 1–2 plain sentences, then cite the passage numbers you used like [1] or [2][4].
- Use only facts stated in the passages. Do not add outside knowledge, interpretation, or opinion.
- If a number or date needs simple arithmetic from the passages (e.g. "the 78th year of His age" means age 77), you may do it and say so briefly.
- When useful, quote a few exact words from a passage in quotation marks.
- If the passages do not contain the answer, reply exactly: NONE`;

async function answer(q, results) {
  if (!results.length) return null;
  const ctx = results.slice(0, 8).map((r, i) => `[${i + 1}] ${r.author || "Compilation"}, ${r.book}${r.section ? ", " + r.section : ""}:\n${r.text.slice(0, 1500)}`).join("\n\n");
  const out = await claude(ANSWER_SYSTEM, `Question: ${q}\n\nPassages:\n${ctx}`, 2000);
  if (!out || /^NONE\b/.test(out)) return null;
  return out;
}

const shape = (r) => ({
  id: r.id, author: r.author, book: r.book, section: r.section, para: r.para,
  citation: r.citation, onBehalf: r.on_behalf, url: r.url, text: r.text, kind: r.kind,
});

export async function POST(req) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (rateLimited(ip)) return Response.json({ error: "Too many searches — please wait a minute." }, { status: 429 });
    const body = await req.json().catch(() => ({}));
    const q = String(body.q || "").trim().slice(0, 300);
    const author = AUTHORS.has(body.author) ? body.author : null;
    if (q.length < 2) return Response.json({ results: [] });

    // Quick facts: hand-checked answers to common basics — instant, no AI needed.
    const fact = author ? null : matchFact(q);
    if (fact) {
      const [factRows, [emb]] = await Promise.all([byIds(fact.ids), embed([q])]);
      if (factRows.length === fact.ids.length) {
        const more = await search(q, emb, null, null, 15);
        // keep the fact passages first, in order, so [1], [2]… line up
        const seen = new Set(factRows.map((r) => norm(r.text)));
        const rest = merge([more]).filter((r) => !fact.ids.includes(r.id) && !seen.has(norm(r.text)));
        const results = [...factRows, ...rest].slice(0, 12).map(shape);
        return Response.json({ results, answer: fact.answer, verified: true, type: "fact" });
      }
    }

    const p = await plan(q);
    const wordings = [q, ...p.queries.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 3);
    const embs = await embed(wordings);
    const kind = p.prayers_only ? "prayers" : null;
    let lists = await Promise.all(wordings.map((w, i) => search(w, embs[i], author, kind, 15)));
    if (kind && lists.every((l) => l.length === 0)) {
      lists = await Promise.all(wordings.map((w, i) => search(w, embs[i], author, null, 15)));
    }
    const merged = merge(lists).slice(0, 12);
    const results = merged.map(shape);
    const quick = p.type === "fact" ? await answer(q, results) : null;
    return Response.json({ results, answer: quick, type: p.type });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Search is having trouble right now. Please try again." }, { status: 500 });
  }
}
