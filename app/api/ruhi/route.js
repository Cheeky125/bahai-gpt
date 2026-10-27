// Phoenix — the passages from the Writings that a unit of a Ruhi book quotes, in section order.
// Only the locations come from the Ruhi books; the passage texts are Phoenix's own library (bahai.org).
// GET ?b=1&u=2
import { ruhiUnitList, byIds, merge, shapeAll, RUHI_UNITS, norm } from "../../lib/engine";

export const runtime = "nodejs";

export async function GET(req) {
  const p = new URL(req.url).searchParams;
  const b = parseInt(p.get("b"), 10), u = parseInt(p.get("u"), 10);
  if (!RUHI_UNITS[b] || !RUHI_UNITS[b][u - 1]) return Response.json({ error: "Not found" }, { status: 404 });
  const list = ruhiUnitList(b, u);
  const rows = [];
  for (let i = 0; i < list.length; i += 80) rows.push(...(await byIds(list.slice(i, i + 80).map((x) => x.id))));
  const secOf = new Map(list.map((x) => [x.id, x.section]));
  // the same passage often appears in several compilations: keep one copy, preferring the original book
  const kept = merge([rows]);
  const sections = new Map();
  const seen = new Set();
  for (const card of shapeAll(kept)) {
    const k = norm(card.text);
    if (seen.has(k)) continue;
    seen.add(k);
    const s = secOf.get(card.id) ?? Math.min(...(card.ruhi || []).filter((x) => x.book === b && x.unit === u).map((x) => x.section));
    if (!sections.has(s)) sections.set(s, []);
    sections.get(s).push(card);
  }
  const out = [...sections.entries()].sort((a, b) => a[0] - b[0]).map(([section, cards]) => ({ section, cards }));
  return Response.json({ book: b, unit: u, unitTitle: RUHI_UNITS[b][u - 1], sections: out }, { headers: { "Cache-Control": "public, max-age=86400" } });
}
