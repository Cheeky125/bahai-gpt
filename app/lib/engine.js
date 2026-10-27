// Phoenix — shared search engine pieces used by /api/search and /api/devotional.
import PRAYERS from "./prayers.json";

export const MODEL = "claude-haiku-5-5";
export const AUTHORS = new Set(["Bahá’u’lláh", "The Báb", "‘Abdu’l-Bahá", "Shoghi Effendi", "The Universal House of Justice"]);
export const CENTRAL_FIGURES = new Set(["Bahá’u’lláh", "The Báb", "‘Abdu’l-Bahá"]);
// When the same words appear in several places, show the primary source first.
const KIND_RANK = { writings: 0, prayers: 0, talks: 1, messages: 2, compilation: 3 };

// ---------- whole prayers ----------
// The Bahá'í Prayers book is stored paragraph by paragraph; prayers.json groups them back into whole prayers.
export { PRAYERS };
const PRAYER_OF = new Map();
PRAYERS.forEach((p, i) => p.ids.forEach((id) => PRAYER_OF.set(id, i)));
export const prayerFor = (paragraphId) => (PRAYER_OF.has(paragraphId) ? PRAYERS[PRAYER_OF.get(paragraphId)] : null);

// ---------- rate limit ----------
const hits = new Map();
export function rateLimited(req, limit = 30) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > limit;
}

// ---------- Claude ----------
export async function claude(system, user, maxTokens = 400) {
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

export function parseJson(s) {
  if (!s) return null;
  const m = s.match(/\{[\s\S]*\}/);
  try { return m ? JSON.parse(m[0]) : null; } catch { return null; }
}

const PLAN_SYSTEM = `You help search a database of paragraphs from the Bahá'í Writings (Bahá'u'lláh, the Báb, 'Abdu'l-Bahá, Shoghi Effendi, the Universal House of Justice, Bahá'í Prayers, and compilations). Given a user's question, reply with ONLY a JSON object:
{"type": "fact" | "topic" | "prayer" | "quote",
 "queries": [2 or 3 short search phrasings that would match how the Writings themselves word it — use the Writings' own vocabulary, e.g. "wine and intoxicating drinks" for alcohol, "progressive revelation" for why are there many religions; keep proper names],
 "prayers_only": true | false}
type "fact" = a question with a short factual answer (who, when, where, how old, how many, what is X). "quote" = the user is looking for a known phrase. "prayer" = the user wants a prayer. "topic" = anything else. prayers_only is true only when they ask for a prayer.`;

export async function plan(q) {
  const fallback = { type: /\bprayers?\b/i.test(q) ? "prayer" : "topic", queries: [], prayers_only: /\bprayers?\b/i.test(q) };
  const out = parseJson(await claude(PLAN_SYSTEM, q, 1500));
  if (!out) return fallback;
  return {
    type: ["fact", "topic", "prayer", "quote"].includes(out.type) ? out.type : "topic",
    queries: Array.isArray(out.queries) ? out.queries.filter((x) => typeof x === "string" && x.trim()).slice(0, 3) : [],
    prayers_only: !!out.prayers_only,
  };
}

// ---------- Voyage + Supabase ----------
export async function embed(texts) {
  const r = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ input: texts, model: "voyage-4", input_type: "query", output_dimension: 1024 }),
  });
  if (!r.ok) throw new Error(`embedding failed (${r.status})`);
  const j = await r.json();
  return j.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

function sbHeaders(json) {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  const headers = { apikey: key };
  if (json) headers["Content-Type"] = "application/json";
  if (key && key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  return headers;
}

export async function search(q, emb, author, kind, count) {
  const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/search_passages`, {
    method: "POST",
    headers: sbHeaders(true),
    body: JSON.stringify({ query_text: q, query_embedding: `[${emb.join(",")}]`, match_count: count, author_filter: author || null, kind_filter: kind || null }),
  });
  if (!r.ok) throw new Error(`search failed (${r.status}): ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

export async function byIds(ids) {
  const cols = "id,book,author,section,para,citation,on_behalf,url,text,kind";
  const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/passages?select=${cols}&id=in.(${ids.map(encodeURIComponent).join(",")})`, { headers: sbHeaders(false) });
  if (!r.ok) throw new Error(`lookup failed (${r.status})`);
  const rows = await r.json();
  return ids.map((id) => rows.find((x) => x.id === id)).filter(Boolean);
}

// ---------- merging ----------
export const norm = (t) => t.toLowerCase().replace(/[^a-zÀ-ɏ]+/g, " ").trim().slice(0, 140);

export function merge(lists) {
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
    else if ((KIND_RANK[r.kind] ?? 9) < (KIND_RANK[prev.kind] ?? 9)) seen.set(k, r);
  }
  return [...seen.values()];
}

// Shape a database row for the browser. A paragraph from the prayer book becomes its whole prayer,
// and several paragraphs of the same prayer collapse into one card.
export function shapeAll(rows) {
  const out = [], seen = new Set();
  for (const r of rows) {
    const p = prayerFor(r.id);
    const id = p ? p.id : r.id;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(p
      ? { id: p.id, author: p.author, book: "Bahá’í Prayers", section: p.sub ? `${p.theme} — ${p.sub}` : p.theme, para: null, citation: null, onBehalf: false, url: p.url, text: p.text, kind: "prayers", prayer: true }
      : { id: r.id, author: r.author, book: r.book, section: r.section, para: r.para, citation: r.citation, onBehalf: r.on_behalf, url: r.url, text: r.text, kind: r.kind });
  }
  return out;
}
