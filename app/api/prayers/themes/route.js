// Phoenix — the names of every prayer theme. The offline worker (public/sw.js) uses this list to save
// every theme's prayers on the phone, so the prayers can be read without internet.
import { PRAYERS } from "../../../lib/engine";

export const runtime = "nodejs";

export async function GET() {
  const names = [...new Set(PRAYERS.flatMap((p) => [p.theme, p.alsoTheme]).filter(Boolean))].sort();
  return Response.json({ themes: names }, { headers: { "Cache-Control": "public, max-age=86400" } });
}
