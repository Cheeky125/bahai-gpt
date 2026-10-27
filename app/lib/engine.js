// Phoenix — shared search engine pieces used by /api/search and /api/devotional.
import PRAYERS from "./prayers.json";
import MEMORIALS from "./stories.json";
import DAWN from "./dawnbreakers.json";
import SONGS from "./songs.json";
import RUHI from "./ruhi.json";
import HIDDEN_IDS from "./hidden.json";

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

export function prayerCard(p) {
  const section = p.sub ? `${p.theme} — ${p.sub}` : p.book === "Bahá’í Prayers" ? p.theme : p.number ? `No. ${p.number}` : null;
  return { id: p.id, author: p.author, book: p.book, section, para: null, citation: null, onBehalf: false, url: p.url, text: p.text, kind: "prayers", prayer: true };
}

// ---------- stories (Memorials of the Faithful, by ‘Abdu’l-Bahá) ----------
// Two sources: Memorials of the Faithful (one story per believer) and The Dawn-Breakers (Nabíl’s
// narrative, each chapter split into readable parts).
const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI", "XXII", "XXIII", "XXIV", "XXV", "XXVI"];
export const STORIES = [...MEMORIALS.map((m) => ({ ...m, book: "Memorials of the Faithful" })), ...DAWN];
export { MEMORIALS, DAWN };
export const storyById = (id) => STORIES.find((x) => x.id === id) || null;
export function storyCard(st) {
  if (st.book === "The Dawn-Breakers") {
    const ch = st.chapter <= 26 ? `Chapter ${ROMAN[st.chapter]}: ${st.chapterTitle}` : st.chapterTitle;
    return { id: st.id, author: "Nabíl-i-A‘ẓam", book: "The Dawn-Breakers", section: st.parts > 1 ? `${ch} (part ${st.part} of ${st.parts})` : ch, para: null, citation: "Translated and edited by Shoghi Effendi", onBehalf: false, url: st.url, text: st.text, kind: "history", story: true };
  }
  return { id: st.id, author: "‘Abdu’l-Bahá", book: "Memorials of the Faithful", section: `${st.n} — ${st.name}`, para: null, citation: null, onBehalf: false, url: st.url, text: st.text, kind: "writings", story: true };
}

// Meaning fingerprints for stories and songs are computed once per server and kept in memory.
const vecCache = new Map();
function docVectors(key, texts) {
  if (!vecCache.has(key)) {
    const p = (async () => {
      const batches = [];
      for (let i = 0; i < texts.length; i += 96) batches.push(texts.slice(i, i + 96));
      const results = await Promise.all(batches.map(async (input) => {
        const r = await fetch("https://api.voyageai.com/v1/embeddings", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ input, model: "voyage-4", input_type: "document", output_dimension: 1024 }),
        });
        if (!r.ok) throw new Error(`embedding failed (${r.status})`);
        const j = await r.json();
        return j.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
      }));
      return results.flat();
    })().catch((e) => { vecCache.delete(key); throw e; });
    vecCache.set(key, p);
  }
  return vecCache.get(key);
}
const storyVectors = () => docVectors("stories", STORIES.map((st) => st.book === "The Dawn-Breakers" ? `${st.chapterTitle}. ${st.text.slice(0, 2500)}` : `${st.name}. ${st.text.slice(0, 3000)}`));
const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
// Stories ranked by how close they are in meaning to a query embedding.
export async function rankStories(queryVec) {
  const vecs = await storyVectors();
  return STORIES.map((st, i) => ({ st, score: dot(queryVec, vecs[i]) })).sort((a, b) => b.score - a.score).map((x) => x.st);
}

// ---------- songs (links to bahaisongproject.com — lyrics and chords stay on their site) ----------
export { SONGS };
export const songCard = (sg) => ({ slug: sg.slug, title: sg.title, by: sg.by, lang: sg.lang, tags: sg.tags, video: sg.video, url: sg.url, source: sg.source ? { book: sg.source.book, author: sg.source.author, url: sg.source.url } : null });
const songVectors = () => docVectors("songs", SONGS.map((sg) => [sg.title, sg.tags.join(", "), sg.about || ""].join(". ")));
// Songs ranked by meaning; English songs only unless `allLanguages`.
export async function rankSongs(queryVec, allLanguages = false) {
  const vecs = await songVectors();
  return SONGS.map((sg, i) => ({ sg, score: dot(queryVec, vecs[i]) + (sg.video ? 0.01 : 0) }))
    .filter((x) => allLanguages || x.sg.lang.includes("English"))
    .sort((a, b) => b.score - a.score).map((x) => x.sg);
}

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

// Lines that aren't passages — contents pages, lists of names, salutations, bare reference lines,
// timelines — are kept in the library but never shown as search results (see scripts/find_hidden.py).
const HIDDEN = new Set(HIDDEN_IDS);

export async function search(q, emb, author, kind, count) {
  const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/search_passages`, {
    method: "POST",
    headers: sbHeaders(true),
    body: JSON.stringify({ query_text: q, query_embedding: `[${emb.join(",")}]`, match_count: count, author_filter: author || null, kind_filter: kind || null }),
  });
  if (!r.ok) throw new Error(`search failed (${r.status}): ${(await r.text()).slice(0, 200)}`);
  return (await r.json()).filter((row) => !HIDDEN.has(row.id));
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
// ---------- Ruhi Institute index ----------
// Where passages from the library are quoted in the Ruhi books (book, unit, section). Built privately from
// the books (scripts/build_ruhi_index.py); only these locations are stored — never any Ruhi text.
export const RUHI_UNITS = RUHI.units;
export const ruhiPlaces = (ids) => {
  const seen = new Set(), out = [];
  for (const id of ids) for (const [b, u, s] of RUHI.passages[id] || []) {
    const k = `${b}.${u}.${s}`;
    if (!seen.has(k)) { seen.add(k); out.push({ book: b, unit: u, section: s, unitTitle: RUHI.units[b]?.[u - 1] || "" }); }
  }
  return out.sort((a, b) => a.book - b.book || a.unit - b.unit || a.section - b.section);
};
export const inRuhiBook = (id, book, unit) => (RUHI.passages[id] || []).some(([b, u]) => b === book && (!unit || u === unit));
export const ruhiPassageIds = (book, unit) => Object.keys(RUHI.passages).filter((id) => inRuhiBook(id, book, unit));
export function ruhiUnitList(book, unit) {
  // passage ids with their first section in this unit, in book order
  return Object.entries(RUHI.passages)
    .map(([id, places]) => [id, places.filter(([b, u]) => b === book && u === unit).map(([, , s]) => s)])
    .filter(([, secs]) => secs.length)
    .map(([id, secs]) => ({ id, section: Math.min(...secs) }))
    .sort((a, b) => a.section - b.section);
}

export function shapeAll(rows) {
  const out = [], seen = new Set();
  for (const r of rows) {
    const p = prayerFor(r.id);
    const id = p ? p.id : r.id;
    if (seen.has(id)) continue;
    seen.add(id);
    const card = p
      ? prayerCard(p)
      : { id: r.id, author: r.author, book: r.book, section: r.section, para: r.para, citation: r.citation, onBehalf: r.on_behalf, url: r.url, text: r.text, kind: r.kind };
    const ruhi = ruhiPlaces(p ? p.ids : [r.id]);
    if (ruhi.length) card.ruhi = ruhi;
    out.push(card);
  }
  return out;
}
