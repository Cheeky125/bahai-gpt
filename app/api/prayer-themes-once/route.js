// TEMPORARY (one-off): suggests themes for prayers from the extra prayer books by comparing their meaning
// with the themed prayers in Bahá'í Prayers. Its output is saved into app/lib/prayer_themes.json and this
// route is then deleted. Returns only prayer ids, theme names and scores.
import { PRAYERS } from "../../lib/engine";

export const runtime = "nodejs";
export const maxDuration = 60;

const SKIP = new Set(["Obligatory Prayers", "Tablet of Aḥmad", "Fire Tablet", "Tablet of the Holy Mariner", "Tablets of Visitation", "America", "The Fund", "Marriage", "Ḥuqúqu’lláh: The Right of God", "Intercalary Days", "Naw-Rúz", "Martyrs and Their Families"]);

async function embedDocs(texts) {
  const out = [];
  for (let i = 0; i < texts.length; i += 64) {
    const r = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ input: texts.slice(i, i + 64), model: "voyage-4", input_type: "document", output_dimension: 1024 }),
    });
    if (!r.ok) throw new Error(`voyage ${r.status}`);
    const j = await r.json();
    out.push(...j.data.sort((a, b) => a.index - b.index).map((d) => d.embedding));
  }
  return out;
}
const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };

let done = null;
export async function GET() {
  if (!done) done = (async () => {
    const base = PRAYERS.filter((p) => p.book === "Bahá’í Prayers" && !SKIP.has(p.theme));
    const extra = PRAYERS.filter((p) => p.group === "More Prayer Books");
    const [bv, ev] = await Promise.all([embedDocs(base.map((p) => p.text.slice(0, 3000))), embedDocs(extra.map((p) => p.text.slice(0, 3000)))]);
    return extra.map((p, i) => {
      const sims = bv.map((v, k) => ({ k, s: dot(ev[i], v) })).sort((a, b) => b.s - a.s);
      const dup = sims[0].s > 0.97 ? base[sims[0].k].id : null;
      const votes = {};
      sims.slice(0, 7).forEach(({ k, s }) => { votes[base[k].theme] = (votes[base[k].theme] || 0) + s; });
      const ranked = Object.entries(votes).sort((a, b) => b[1] - a[1]).map(([t, v]) => [t, +v.toFixed(3)]);
      return { id: p.id, dup, top: +sims[0].s.toFixed(3), themes: ranked.slice(0, 3) };
    });
  })().catch((e) => { done = null; throw e; });
  try { return Response.json({ results: await done }); }
  catch (e) { return Response.json({ error: String(e) }, { status: 500 }); }
}
