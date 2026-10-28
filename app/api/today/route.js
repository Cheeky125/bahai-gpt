// Phoenix — the morning and evening reading. Everyone gets the same two passages on the same day, drawn from
// the Writings of Bahá’u’lláh and the Báb (app/lib/daily.json: whole paragraphs that stand on their own).
// GET ?d=YYYY-MM-DD (the reader's own date)
import POOL from "../../lib/daily.json";
import { byIds, shapeAll } from "../../lib/engine";

export const runtime = "nodejs";

function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

export async function GET(req) {
  const d = new URL(req.url).searchParams.get("d") || "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return Response.json({ error: "Bad date" }, { status: 400 });
  // walk through the pool in a fixed shuffled order, two a day, so nothing repeats for about 20 months
  const day = Math.floor(Date.parse(d) / 86400000);
  const n = POOL.length;
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  let step = hash("phoenix") % n;
  while (gcd(step, n) !== 1) step++;
  const pick = (k) => POOL[(((day * 2 + k) % n) * step) % n];
  const ids = [pick(0), pick(1)];
  const rows = await byIds(ids);
  const cards = shapeAll(ids.map((id) => rows.find((r) => r.id === id)).filter(Boolean));
  return Response.json({ date: d, morning: cards[0] || null, evening: cards[1] || null }, { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
}
