// Phoenix — whole prayers by theme or collection.
import { PRAYERS, prayerCard } from "../../lib/engine";

export async function GET(req) {
  const theme = new URL(req.url).searchParams.get("theme") || "";
  const list = PRAYERS.filter((p) => p.theme === theme).map((p) => ({ ...prayerCard(p), sub: p.sub }));
  return Response.json({ theme, prayers: list }, { headers: { "Cache-Control": "public, max-age=86400" } });
}
