// Phoenix — build a devotional on a theme: an opening prayer, two readings from the Writings of
// Bahá'u'lláh, the Báb and 'Abdu'l-Bahá, and a closing prayer. Everything is quoted word for word.
// `seed` changes which passages are picked, so "Shuffle" gives a fresh devotional on the same theme.

import { rateLimited, plan, embed, search, merge, prayerFor, shapeAll, CENTRAL_FIGURES, PRAYERS } from "../../lib/engine";

export const runtime = "nodejs";
export const maxDuration = 30;

const SKIP_THEMES = new Set(["Obligatory Prayers", "Tablet of Aḥmad", "Fire Tablet", "Tablet of the Holy Mariner", "Tablets of Visitation"]);
const okPrayer = (p) => p && !SKIP_THEMES.has(p.theme) && p.text.length <= 2200 && !p.text.startsWith("(");

function pick(list, n, seed) {
  // take n items from the top of the list, rotating by seed so each shuffle differs
  const pool = list.slice(0, Math.max(n, Math.min(list.length, n * 3)));
  const out = [];
  for (let i = 0; i < pool.length && out.length < n; i++) out.push(pool[(i + seed * n) % pool.length]);
  return [...new Set(out)];
}

export async function POST(req) {
  try {
    if (rateLimited(req, 20)) return Response.json({ error: "Too many requests — please wait a minute." }, { status: 429 });
    const body = await req.json().catch(() => ({}));
    const theme = String(body.theme || "").trim().slice(0, 120);
    const seed = Math.abs(parseInt(body.seed, 10) || 0) % 1000;
    if (theme.length < 2) return Response.json({ error: "Choose a theme first." }, { status: 400 });

    const p = await plan(theme);
    const wordings = [theme, ...p.queries.filter((x) => x.toLowerCase() !== theme.toLowerCase())].slice(0, 3);
    const embs = await embed(wordings);
    const [prayerLists, readingLists] = await Promise.all([
      Promise.all(wordings.map((w, i) => search(w, embs[i], null, "prayers", 30))),
      Promise.all(wordings.map((w, i) => search(w, embs[i], null, "writings", 30))),
    ]);

    // Prayers: whole prayers from the prayer book only.
    const seenP = new Set();
    let prayers = [];
    for (const r of merge(prayerLists)) {
      const pr = prayerFor(r.id);
      if (okPrayer(pr) && !seenP.has(pr.id)) { seenP.add(pr.id); prayers.push(pr); }
    }
    if (prayers.length < 2) {
      // fall back to prayers filed under a matching theme in the prayer book
      const t = theme.toLowerCase();
      prayers = prayers.concat(PRAYERS.filter((x) => okPrayer(x) && !seenP.has(x.id) && (x.theme.toLowerCase().includes(t) || t.includes(x.theme.toLowerCase()))));
    }
    if (prayers.length < 2) prayers = prayers.concat(PRAYERS.filter((x) => okPrayer(x) && x.theme === "Spiritual Growth" && !seenP.has(x.id)));

    // Readings: Central Figures' Writings, a comfortable length to read aloud.
    const readings = merge(readingLists).filter((r) => CENTRAL_FIGURES.has(r.author) && r.text.length >= 150 && r.text.length <= 1400);

    const [opening, closing] = pick(prayers, 2, seed);
    const chosen = pick(readings, 2, seed);
    const asCard = (pr) => pr && shapeAll([{ id: pr.ids[0] }])[0];
    return Response.json({
      theme,
      opening: asCard(opening),
      readings: shapeAll(chosen),
      closing: asCard(closing),
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Couldn’t build a devotional right now. Please try again." }, { status: 500 });
  }
}
