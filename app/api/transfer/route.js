// Phoenix — move saved items and streaks to another device with a one-time code (see db/5_transfer.sql).
// POST { data } → { code }      GET ?code=ABC123 → { data } (once; codes last 24 hours)
import { rateLimited } from "../../lib/engine";

export const runtime = "nodejs";

async function rpc(fn, body) {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  const headers = { apikey: key, "Content-Type": "application/json" };
  if (key && key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: "POST", headers, body: JSON.stringify(body), cache: "no-store" });
  if (!r.ok) throw new Error(`${fn} ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

export async function POST(req) {
  try {
    if (rateLimited(req, 10)) return Response.json({ error: "Too many tries — please wait a minute." }, { status: 429 });
    const b = await req.json().catch(() => null);
    const data = b && b.data;
    if (!data || typeof data !== "object") return Response.json({ error: "Nothing to move." }, { status: 400 });
    if (JSON.stringify(data).length > 350000) return Response.json({ error: "That’s too much to move at once." }, { status: 413 });
    const code = await rpc("phoenix_transfer_put", { payload: data });
    return Response.json({ code });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Couldn’t make a code right now. Please try again." }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    if (rateLimited(req, 10)) return Response.json({ error: "Too many tries — please wait a minute." }, { status: 429 });
    const code = (new URL(req.url).searchParams.get("code") || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (code.length !== 6) return Response.json({ error: "Codes have 6 letters and numbers." }, { status: 400 });
    const data = await rpc("phoenix_transfer_take", { code_in: code });
    if (!data) return Response.json({ error: "That code didn’t work. It may have been used already or be more than a day old." }, { status: 404 });
    return Response.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Couldn’t check that code right now. Please try again." }, { status: 500 });
  }
}
