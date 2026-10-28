// Phoenix — the quotes from the Writings in one unit of a Ruhi book, section by section, cut exactly where
// the book cuts them. Only the cut positions come from the Ruhi books; the words are Phoenix's own library
// (Bahá’í Reference Library). GET ?b=1&u=2
import { ruhiUnitQuotes, ruhiExcerpt, byIds, RUHI_UNITS } from "../../lib/engine";

export const runtime = "nodejs";

export async function GET(req) {
  const p = new URL(req.url).searchParams;
  const b = parseInt(p.get("b"), 10), u = parseInt(p.get("u"), 10);
  if (!RUHI_UNITS[b] || !RUHI_UNITS[b][u - 1]) return Response.json({ error: "Not found" }, { status: 404 });
  const sections = ruhiUnitQuotes(b, u);
  const ids = [...new Set(sections.flatMap((s) => s.quotes.map((q) => q.id)))];
  const rows = [];
  for (let i = 0; i < ids.length; i += 80) rows.push(...(await byIds(ids.slice(i, i + 80))));
  const byId = new Map(rows.map((r) => [r.id, r]));
  const out = sections.map((s) => ({
    section: s.section,
    quotes: s.quotes.filter((q) => byId.has(q.id)).map((q) => {
      const r = byId.get(q.id);
      return {
        key: `${b}.${u}.${s.section}:${q.id}:${q.parts[0][0]}`,
        id: r.id, excerpt: ruhiExcerpt(r.text, q.parts, q.m), full: r.text,
        author: r.author, book: r.book, source: r.section, para: r.para, url: r.url,
      };
    }),
  }));
  return Response.json({ book: b, unit: u, unitTitle: RUHI_UNITS[b][u - 1], sections: out }, { headers: { "Cache-Control": "public, max-age=3600" } });
}
