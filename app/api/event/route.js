// Phoenix — store one anonymous click event in Supabase "events" (insert-only; see db/4_events.sql).
import { rateLimited } from "../../lib/engine";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    if (rateLimited(req, 120)) return new Response(null, { status: 204 });
    const b = await req.json().catch(() => ({}));
    const name = String(b.name || "");
    if (!/^[a-z_]{2,40}$/.test(name)) return new Response(null, { status: 204 });
    const clip = (v, n) => (v == null || v === "" ? null : String(v).replace(/\s+/g, " ").trim().slice(0, n));
    const row = { name, detail: clip(b.detail, 120), page: clip(b.page, 200), visitor: clip(b.visitor, 40) };
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    const headers = { apikey: key, "Content-Type": "application/json", Prefer: "return=minimal" };
    if (key && key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
    const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/events`, { method: "POST", headers, body: JSON.stringify(row) });
    if (!r.ok) console.error("event", r.status, (await r.text()).slice(0, 200));
  } catch (e) { console.error(e); }
  return new Response(null, { status: 204 });
}
