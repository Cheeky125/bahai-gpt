// Phoenix — keep the free Supabase database awake.
// Supabase pauses free projects after about a week without activity. Vercel calls this route once a day
// (see vercel.json "crons"); it reads a single passage id, which counts as activity.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  const headers = { apikey: key };
  if (key && key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/passages?select=id&limit=1`, { headers, cache: "no-store" });
    const ok = r.ok;
    if (!ok) console.error("keepalive", r.status, (await r.text()).slice(0, 200));
    return Response.json({ ok, at: new Date().toISOString() }, { status: ok ? 200 : 502 });
  } catch (e) {
    console.error("keepalive", e);
    return Response.json({ ok: false }, { status: 502 });
  }
}
