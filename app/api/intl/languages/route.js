// Phoenix — languages with prayers on BahaiPrayers.net. GET → [{ id, name, english, culture, rtl, count }]
import { bp } from "../../../lib/bp";

export const runtime = "nodejs";

export async function GET() {
  try {
    const list = await bp("/api/prayer/Languages");
    const out = list.filter((l) => l.PrayerCount > 0).map((l) => ({ id: l.Id, name: l.Name, english: l.English, culture: l.Culture, rtl: !l.IsLeftToRight, count: l.PrayerCount }))
      .sort((a, b) => a.english.localeCompare(b.english));
    return Response.json(out, { headers: { "Cache-Control": "public, max-age=600, s-maxage=86400, stale-while-revalidate=86400" } });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Other languages aren’t available right now." }, { status: 502 });
  }
}
