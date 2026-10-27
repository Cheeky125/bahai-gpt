// Phoenix — whole prayers by theme or collection.
// A theme page lists the prayer book's own prayers for that theme, then matching prayers from the other
// prayer books (themes for those were matched by meaning; prayers that duplicate one in the book are left out).
import { PRAYERS, prayerCard } from "../../lib/engine";

export async function GET(req) {
  const theme = new URL(req.url).searchParams.get("theme") || "";
  const own = PRAYERS.filter((p) => p.theme === theme).map((p) => ({ ...prayerCard(p), sub: p.sub }));
  const related = PRAYERS.filter((p) => p.alsoTheme === theme && !p.dup).map((p) => ({ ...prayerCard(p), sub: null, related: true }));
  return Response.json({ theme, prayers: [...own, ...related] }, { headers: { "Cache-Control": "public, max-age=86400" } });
}
