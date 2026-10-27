// Phoenix — receive feedback from the site and store it in the Supabase "feedback" table (insert-only).
import { rateLimited } from "../../lib/engine";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    if (rateLimited(req, 5)) return Response.json({ error: "Thanks! Please wait a minute before sending more." }, { status: 429 });
    const b = await req.json().catch(() => ({}));
    const message = String(b.message || "").trim().slice(0, 3000);
    if (message.length < 2) return Response.json({ error: "Please write a little feedback first." }, { status: 400 });
    const row = {
      message,
      page: String(b.page || "").slice(0, 500) || null,
      query: String(b.query || "").slice(0, 300) || null,
      contact: String(b.contact || "").trim().slice(0, 200) || null,
    };
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    const headers = { apikey: key, "Content-Type": "application/json", Prefer: "return=minimal" };
    if (key && key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
    const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/feedback`, { method: "POST", headers, body: JSON.stringify(row) });
    if (!r.ok) { console.error("feedback", r.status, (await r.text()).slice(0, 200)); return Response.json({ error: "Couldn’t send feedback right now. Please try again later." }, { status: 500 }); }
    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Couldn’t send feedback right now. Please try again later." }, { status: 500 });
  }
}
