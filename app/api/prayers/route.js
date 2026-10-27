// Phoenix — whole prayers from the Bahá'í Prayers book, by theme.
import { PRAYERS } from "../../lib/engine";

export async function GET(req) {
  const theme = new URL(req.url).searchParams.get("theme") || "";
  const list = PRAYERS.filter((p) => p.theme === theme).map((p) => ({
    id: p.id, author: p.author, book: "Bahá’í Prayers", section: p.sub ? `${p.theme} — ${p.sub}` : p.theme,
    sub: p.sub, url: p.url, text: p.text, kind: "prayers", prayer: true,
  }));
  return Response.json({ theme, prayers: list }, { headers: { "Cache-Control": "public, max-age=86400" } });
}
