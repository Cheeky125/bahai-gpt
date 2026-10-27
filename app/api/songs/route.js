// Phoenix — Bahá'í songs from the bahá'í song project (bahaisongproject.com).
// Phoenix only lists names and links; lyrics, chords and videos stay on their site.
// GET        → every song (title, artists, language, tags, link)
// POST {q}   → songs closest in meaning to what was asked (English by default; {all: true} for every language)
import { SONGS, songCard, rankSongs, embed, rateLimited } from "../../lib/engine";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET() {
  return Response.json({ songs: SONGS.map(songCard) }, { headers: { "Cache-Control": "public, max-age=86400" } });
}

export async function POST(req) {
  try {
    if (rateLimited(req)) return Response.json({ error: "Too many searches — please wait a minute." }, { status: 429 });
    const body = await req.json().catch(() => ({}));
    const q = String(body.q || "").trim().slice(0, 200);
    if (q.length < 2) return Response.json({ results: [] });
    const [vec] = await embed([q]);
    const ranked = await rankSongs(vec, !!body.all);
    return Response.json({ results: ranked.slice(0, 8).map(songCard) });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Couldn’t search the songs right now. Please try again." }, { status: 500 });
  }
}
