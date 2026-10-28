// Phoenix — find a city for sunrise/sunset times (Open-Meteo's free geocoding; only the typed name is sent).
import { rateLimited } from "../../lib/engine";

export const runtime = "nodejs";

export async function GET(req) {
  if (rateLimited(req, 30)) return Response.json({ error: "Too many requests" }, { status: 429 });
  const q = (new URL(req.url).searchParams.get("q") || "").trim().slice(0, 80);
  if (q.length < 2) return Response.json({ results: [] });
  try {
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?count=6&language=en&format=json&name=${encodeURIComponent(q)}`);
    const j = await r.json();
    const results = (j.results || []).map((x) => ({ name: x.name, region: x.admin1 || "", country: x.country || "", lat: x.latitude, lon: x.longitude, tz: x.timezone }));
    return Response.json({ results }, { headers: { "Cache-Control": "public, max-age=86400" } });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "City search isn’t working right now." }, { status: 502 });
  }
}
