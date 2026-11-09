// Phoenix — sung versions of prayers. BahaiPrayers.net links many English prayers to recordings on
// YouTube; this matches them to Phoenix's own prayers by their opening words. GET → { map: { prayerId: [videoId…] } }
import { bp, youtubeId } from "../../lib/bp";
import { PRAYERS } from "../../lib/engine";

export const runtime = "nodejs";

const norm = (t) => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’‘'`ʼ]/g, "").replace(/[^a-z]+/g, " ").trim().split(" ").filter(Boolean);
const shingles = (w, n = 6, max = 60) => { const s = new Set(); const x = w.slice(0, max); for (let i = 0; i + n <= x.length; i++) s.add(x.slice(i, i + n).join(" ")); return s; };

let cache = null;
async function build() {
  if (cache && Date.now() - cache.at < 86400000) return cache.map;
  const sys = await bp("/api/prayer/prayersystembylanguage?html=false&languageid=1");
  const theirs = [];
  for (const p of sys.Prayers || []) {
    const links = [...(p.Urls || []).map((u) => u.Url || u.Link), ...(sys.Urls || []).filter((u) => u.PrayerId === p.Id).map((u) => u.Link)];
    const vids = [...new Set(links.map(youtubeId).filter(Boolean))];
    if (vids.length) theirs.push({ sh: shingles(norm(p.Text)), vids, len: norm(p.Text).length, start: norm(p.Text).slice(0, 10).join(" "), head: " " + norm(p.Text).slice(0, 25).join(" ") + " " });
  }
  const index = new Map();
  theirs.forEach((t, i) => t.sh.forEach((s) => { if (!index.has(s)) index.set(s, []); index.get(s).push(i); }));
  const map = {}, check = [];
  for (const p of PRAYERS) {
    const w = norm(p.text);
    const votes = new Map();
    for (const s of shingles(w)) for (const i of index.get(s) || []) votes.set(i, (votes.get(i) || 0) + 1);
    let best = -1, n = 0;
    for (const [i, v] of votes) if (v > n) { best = i; n = v; }
    // enough of the opening words in common, and roughly the same length
    // a strong match, or a weaker one whose opening words appear near the start of theirs (after a heading)
    const opens = best >= 0 && theirs[best].head.includes(" " + w.slice(0, 6).join(" ") + " ");
    if (best >= 0 && (n >= 10 || (n >= 6 && opens)) && Math.abs(theirs[best].len - w.length) <= Math.max(25, w.length * 0.35)) {
      map[p.id] = theirs[best].vids.slice(0, 6);
      check.push({ id: p.id, votes: n, ours: w.slice(0, 10).join(" "), theirs: theirs[best].start, lens: [w.length, theirs[best].len] });
    }
  }
  cache = { at: Date.now(), map, check };
  return map;
}

export async function GET(req) {
  try {
    const map = await build();
    // ?check=1: the matches whose opening words differ, to review by hand
    if (new URL(req.url).searchParams.get("check")) return Response.json(cache.check.filter((c) => c.ours.split(" ").slice(0, 6).join(" ") !== c.theirs.split(" ").slice(0, 6).join(" ")));
    return Response.json({ map, source: "BahaiPrayers.net" }, { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400" } });
  } catch (e) {
    console.error(e);
    return Response.json({ map: {} }, { status: 200, headers: { "Cache-Control": "public, max-age=300" } });
  }
}
