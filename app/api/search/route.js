// Phoenix search API: embeds the question with Voyage, then runs the hybrid search in Supabase.
// Only verbatim passages from the database are returned — nothing is generated.

export const runtime = "nodejs";

const AUTHORS = new Set([
  "Bahá’u’lláh",
  "The Báb",
  "‘Abdu’l-Bahá",
  "Shoghi Effendi",
  "The Universal House of Justice",
]);

// Small in-memory limiter so one visitor can't run up the bill (resets when the server restarts).
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 30;
}

async function embed(q) {
  const r = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ input: [q], model: "voyage-4", input_type: "query", output_dimension: 1024 }),
  });
  if (!r.ok) throw new Error(`embedding failed (${r.status})`);
  const j = await r.json();
  return j.data[0].embedding;
}

async function search(q, emb, author, count) {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  const headers = { apikey: key, "Content-Type": "application/json" };
  if (key && key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/search_passages`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query_text: q,
      query_embedding: `[${emb.join(",")}]`,
      match_count: count,
      author_filter: author || null,
    }),
  });
  if (!r.ok) throw new Error(`search failed (${r.status}): ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

export async function POST(req) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (rateLimited(ip)) {
      return Response.json({ error: "Too many searches — please wait a minute." }, { status: 429 });
    }
    const body = await req.json().catch(() => ({}));
    const q = String(body.q || "").trim().slice(0, 300);
    const author = AUTHORS.has(body.author) ? body.author : null;
    if (q.length < 2) return Response.json({ results: [] });
    const emb = await embed(q);
    const rows = await search(q, emb, author, 12);
    const results = rows.map((r) => ({
      id: r.id, author: r.author, book: r.book, section: r.section, para: r.para,
      citation: r.citation, onBehalf: r.on_behalf, url: r.url, text: r.text,
    }));
    return Response.json({ results });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Search is having trouble right now. Please try again." }, { status: 500 });
  }
}
