// Phoenix — build a devotional on a theme. By default: an opening prayer, a reading, a story, another
// reading, a song (a link to the bahá'í song project), and a closing prayer. `counts` lets people choose
// how many prayers, readings, stories and songs they want (e.g. 10 prayers on justice and nothing else).
// Prayers, readings and stories are quoted word for word.
// `seed` changes which passages are picked, so "Shuffle" gives a fresh devotional on the same theme.

import { rateLimited, plan, embed, search, merge, prayerFor, shapeAll, prayerCard, storyCard, rankStories, songCard, rankSongs, CENTRAL_FIGURES, PRAYERS } from "../../lib/engine";

export const runtime = "nodejs";
export const maxDuration = 30;

const SKIP_THEMES = new Set(["Obligatory Prayers", "Tablet of Aḥmad", "Fire Tablet", "Tablet of the Holy Mariner", "Tablets of Visitation"]);
// Skip prayers that open with an instruction from the book ("…recite this:", "The following commune…").
const startsWithInstruction = (t) => { const first = t.split("\n")[0]; return t.startsWith("(") || /[:…]\s*$/.test(first) || /\b(recite|supplication|commune)\b/i.test(first) && first.length < 260; };
const okPrayer = (p) => p && !SKIP_THEMES.has(p.theme) && p.text.length <= 2200 && !startsWithInstruction(p.text);

const LIMITS = { prayers: 12, readings: 10, stories: 3, songs: 3 };
const DEFAULTS = { prayers: 2, readings: 2, stories: 1, songs: 1 };
function readCounts(c) {
  const out = {};
  for (const k of Object.keys(LIMITS)) {
    const v = parseInt(c?.[k], 10);
    out[k] = Number.isFinite(v) ? Math.max(0, Math.min(LIMITS[k], v)) : DEFAULTS[k];
  }
  return out;
}

// Put the pieces in a natural order: opening prayer, then readings, stories, songs and any further
// prayers taking turns, then the closing prayer.
function arrange(prayers, readings, stories, songs) {
  const items = [];
  const opening = prayers[0], closing = prayers.length > 1 ? prayers[prayers.length - 1] : null;
  const middlePrayers = prayers.slice(1, prayers.length > 1 ? -1 : undefined);
  if (opening) items.push({ type: "prayer", label: prayers.length > 1 ? "Opening prayer" : "Prayer", card: opening });
  const queues = [
    readings.map((card) => ({ type: "reading", label: "Reading", card })),
    stories.map((card) => ({ type: "story", label: "A story", card })),
    songs.map((song) => ({ type: "song", label: "A song", song })),
    middlePrayers.map((card) => ({ type: "prayer", label: "Prayer", card })),
  ];
  while (queues.some((q) => q.length)) for (const q of queues) if (q.length) items.push(q.shift());
  if (closing) items.push({ type: "prayer", label: "Closing prayer", card: closing });
  return items;
}

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
    const counts = readCounts(body.counts);
    if (Object.values(counts).every((v) => v === 0)) return Response.json({ error: "Choose at least one prayer, reading, story or song." }, { status: 400 });
    if (theme.length < 2) return Response.json({ error: "Choose a theme first." }, { status: 400 });

    const p = await plan(theme);
    const wordings = [theme, ...p.queries.filter((x) => x.toLowerCase() !== theme.toLowerCase())].slice(0, 3);
    const embs = await embed(wordings);
    const none = async () => [];
    const many = Math.max(counts.prayers, counts.readings) > 4 ? 50 : 30;
    const [prayerLists, readingLists, storiesRanked, songsRanked] = await Promise.all([
      counts.prayers ? Promise.all(wordings.map((w, i) => search(w, embs[i], null, "prayers", many))) : none(),
      counts.readings ? Promise.all(wordings.map((w, i) => search(w, embs[i], null, "writings", many))) : none(),
      counts.stories ? rankStories(embs[0]).catch((e) => { console.error(e); return []; }) : none(),
      counts.songs ? rankSongs(embs[0]).catch((e) => { console.error(e); return []; }) : none(),
    ]);

    // Prayers: whole prayers (from the prayer books).
    const seenP = new Set();
    let prayers = [];
    for (const r of merge(prayerLists)) {
      const pr = prayerFor(r.id);
      if (okPrayer(pr) && !seenP.has(pr.id)) { seenP.add(pr.id); prayers.push(pr); }
    }
    if (prayers.length < counts.prayers) {
      // fall back to prayers filed under a matching theme in the prayer book
      const t = theme.toLowerCase();
      prayers = prayers.concat(PRAYERS.filter((x) => okPrayer(x) && !seenP.has(x.id) && (x.theme.toLowerCase().includes(t) || t.includes(x.theme.toLowerCase()))));
    }
    if (prayers.length < Math.min(2, counts.prayers)) prayers = prayers.concat(PRAYERS.filter((x) => okPrayer(x) && x.theme === "Spiritual Growth" && !seenP.has(x.id)));

    // Readings: Central Figures' Writings, a comfortable length to read aloud.
    const readings = merge(readingLists).filter((r) => CENTRAL_FIGURES.has(r.author) && r.book !== "Memorials of the Faithful" && r.text.length >= 150 && r.text.length <= 1400);

    const chosenPrayers = pick(prayers, counts.prayers, seed).map(prayerCard);
    const chosenReadings = shapeAll(pick(readings, counts.readings, seed));
    const chosenStories = pick(storiesRanked, counts.stories, seed).map(storyCard);
    const chosenSongs = pick(songsRanked, counts.songs, seed).map(songCard);
    const items = arrange(chosenPrayers, chosenReadings, chosenStories, chosenSongs);
    // say so if there weren't enough on this theme for what was asked
    const short = [];
    if (chosenPrayers.length < counts.prayers) short.push(`${chosenPrayers.length} of ${counts.prayers} prayers`);
    if (chosenReadings.length < counts.readings) short.push(`${chosenReadings.length} of ${counts.readings} readings`);
    return Response.json({ theme, counts, items, short });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Couldn’t build a devotional right now. Please try again." }, { status: 500 });
  }
}
