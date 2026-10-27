// Phoenix — stories from Memorials of the Faithful (‘Abdu’l-Bahá’s accounts of early believers).
// GET            → the list of stories (names and a short opening line)
// GET ?id=…      → one whole story
// POST {q}       → the stories closest in meaning to what was asked
import { STORIES, storyCard, rankStories, embed, rateLimited } from "../../lib/engine";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req) {
  const id = new URL(req.url).searchParams.get("id");
  if (id) {
    const st = STORIES.find((x) => x.id === id);
    return st ? Response.json({ story: storyCard(st) }) : Response.json({ error: "Not found" }, { status: 404 });
  }
  const list = STORIES.map((st) => ({ id: st.id, n: st.n, name: st.name, preview: st.text.split(/(?<=[.!?])\s/)[0].slice(0, 160) }));
  return Response.json({ stories: list }, { headers: { "Cache-Control": "public, max-age=86400" } });
}

export async function POST(req) {
  try {
    if (rateLimited(req)) return Response.json({ error: "Too many searches — please wait a minute." }, { status: 429 });
    const body = await req.json().catch(() => ({}));
    const q = String(body.q || "").trim().slice(0, 200);
    if (q.length < 2) return Response.json({ results: [] });
    const [vec] = await embed([q]);
    const ranked = await rankStories(vec);
    return Response.json({ results: ranked.slice(0, 5).map(storyCard) });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Couldn’t search the stories right now. Please try again." }, { status: 500 });
  }
}
