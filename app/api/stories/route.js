// Phoenix — stories: Memorials of the Faithful (‘Abdu’l-Bahá’s accounts of early believers) and
// The Dawn-Breakers (Nabíl’s narrative, translated and edited by Shoghi Effendi), shown word for word.
// GET            → the lists of stories (Memorials by name; Dawn-Breakers by chapter)
// GET ?id=…      → one whole story (with previous/next part for The Dawn-Breakers)
// POST {q}       → the stories closest in meaning to what was asked
import { MEMORIALS, DAWN, storyById, storyCard, rankStories, embed, rateLimited } from "../../lib/engine";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req) {
  const id = new URL(req.url).searchParams.get("id");
  if (id) {
    const st = storyById(id);
    if (!st) return Response.json({ error: "Not found" }, { status: 404 });
    let prev = null, next = null;
    if (st.book === "The Dawn-Breakers") {
      const i = DAWN.findIndex((x) => x.id === id);
      prev = DAWN[i - 1]?.id || null; next = DAWN[i + 1]?.id || null;
    }
    return Response.json({ story: storyCard(st), prev, next });
  }
  const memorials = MEMORIALS.map((st) => ({ id: st.id, n: st.n, name: st.name, preview: st.text.split(/(?<=[.!?])\s/)[0].slice(0, 160) }));
  const chapters = [];
  for (const p of DAWN) {
    if (p.part === 1) chapters.push({ id: p.id, n: p.chapter, title: p.chapterTitle, parts: p.parts });
  }
  return Response.json({ stories: memorials, dawnbreakers: chapters }, { headers: { "Cache-Control": "public, max-age=86400" } });
}

export async function POST(req) {
  try {
    if (rateLimited(req)) return Response.json({ error: "Too many searches — please wait a minute." }, { status: 429 });
    const body = await req.json().catch(() => ({}));
    const q = String(body.q || "").trim().slice(0, 200);
    if (q.length < 2) return Response.json({ results: [] });
    const [vec] = await embed([q]);
    const ranked = await rankStories(vec);
    return Response.json({ results: ranked.slice(0, 6).map(storyCard) });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Couldn’t search the stories right now. Please try again." }, { status: 500 });
  }
}
