// Phoenix — all the prayers in one language, sorted into that language's own themes (BahaiPrayers.net).
// GET ?lang=5 → { language, rtl, culture, themes: [{ id, name, count }], prayers: [{ id, author, text, themes, videos }] }
import { bp, BP_AUTHORS, youtubeId } from "../../../lib/bp";

export const runtime = "nodejs";

export async function GET(req) {
  const lang = parseInt(new URL(req.url).searchParams.get("lang"), 10);
  if (!lang || lang < 1 || lang > 999) return Response.json({ error: "Bad language" }, { status: 400 });
  try {
    const [langs, sys] = await Promise.all([bp("/api/prayer/Languages"), bp(`/api/prayer/prayersystembylanguage?html=false&languageid=${lang}`)]);
    const L = langs.find((l) => l.Id === lang);
    if (!L) return Response.json({ error: "Not found" }, { status: 404 });
    const tagsOf = new Map();
    for (const r of sys.TagRelations || []) { if (!tagsOf.has(r.PrayerId)) tagsOf.set(r.PrayerId, []); tagsOf.get(r.PrayerId).push(r.PrayerTagId); }
    const vidsOf = new Map();
    for (const u of sys.Urls || []) { const v = youtubeId(u.Link); if (v) { if (!vidsOf.has(u.PrayerId)) vidsOf.set(u.PrayerId, []); vidsOf.get(u.PrayerId).push(v); } }
    const prayers = (sys.Prayers || []).map((p) => {
      const themes = [...new Set([...(tagsOf.get(p.Id) || []), ...(p.Tags || []).map((t) => t.Id)])];
      const videos = [...new Set([...(vidsOf.get(p.Id) || []), ...(p.Urls || []).map((u) => youtubeId(u.Url || u.Link)).filter(Boolean)])].slice(0, 6);
      return { id: p.Id, author: BP_AUTHORS[p.AuthorId] || "", text: String(p.Text || "").replace(/\r\n/g, "\n").trim(), themes, videos };
    }).filter((p) => p.text);
    const counts = new Map();
    for (const p of prayers) for (const t of p.themes) counts.set(t, (counts.get(t) || 0) + 1);
    const themes = (sys.Tags || []).filter((t) => counts.get(t.Id)).map((t) => ({ id: t.Id, name: t.Name, count: counts.get(t.Id) }))
      .sort((a, b) => a.name.localeCompare(b.name, L.Culture || undefined));
    return Response.json({ language: L.Name, english: L.English, culture: L.Culture, rtl: !L.IsLeftToRight, themes, prayers },
      { headers: { "Cache-Control": "public, max-age=600, s-maxage=86400, stale-while-revalidate=86400" } });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Couldn’t load prayers in that language right now." }, { status: 502 });
  }
}
