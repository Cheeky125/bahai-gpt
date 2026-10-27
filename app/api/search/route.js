// Phoenix search API.
// 0. Quick facts: hand-checked answers to common basics (facts.js) — instant, no AI.
// 1. (needs ANTHROPIC_API_KEY) Claude reads the question and suggests better search wording,
//    whether it's a simple fact question, and whether the person wants prayers.
// 2. Every search wording is embedded with Voyage and run through the hybrid search in Supabase.
// 3. Results are merged, duplicates removed, and prayer-book paragraphs shown as whole prayers.
// 4. For fact questions, Claude writes a 1–2 sentence answer using ONLY the passages found,
//    citing them by number. Passages themselves are always shown verbatim.

import { matchFact } from "./facts";
import { AUTHORS, rateLimited, claude, plan, embed, search, byIds, norm, merge, shapeAll, inRuhiBook, RUHI_UNITS } from "../../lib/engine";

// "that quote from Book 7 about…", "ruhi book 1 prayer", "book two" → search only passages quoted in that Ruhi book.
const NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 };
function ruhiBookIn(q) {
  const m = q.match(/\b(?:ruhi\s+)?book\s*(?:#|no\.?\s*)?([1-8]|one|two|three|four|five|six|seven|eight)\b/i);
  if (!m) return null;
  const book = NUM[m[1].toLowerCase()] || parseInt(m[1], 10);
  const rest = q.replace(m[0], " ")
    .replace(/\b(ruhi|find( me)?|show( me)?|where( is)?|which|what|that|the|a|quote|quotation|passage|from|in|of|about|on|is|it|unit|section|does|do|say|says|talk|talks|mention|mentions)\b/gi, " ")
    .replace(/\s+/g, " ").trim();
  return { book, rest };
}

export const runtime = "nodejs";
export const maxDuration = 30;

const ANSWER_SYSTEM = `You answer short factual questions about the Bahá'í Faith using ONLY the numbered passages provided. Rules:
- Answer in 1–2 plain sentences, then cite the passage numbers you used like [1] or [2][4].
- Use only facts stated in the passages. Do not add outside knowledge, interpretation, or opinion.
- If a number or date needs simple arithmetic from the passages (e.g. "the 78th year of His age" means age 77), you may do it and say so briefly.
- When useful, quote a few exact words from a passage in quotation marks.
- If the passages do not contain the answer, reply exactly: NONE`;

async function answer(q, results) {
  if (!results.length) return null;
  const ctx = results.slice(0, 8).map((r, i) => `[${i + 1}] ${r.author || "Compilation"}, ${r.book}${r.section ? ", " + r.section : ""}:\n${r.text.slice(0, 1500)}`).join("\n\n");
  const out = await claude(ANSWER_SYSTEM, `Question: ${q}\n\nPassages:\n${ctx}`, 2000);
  if (!out || /^NONE\b/.test(out)) return null;
  return out;
}

export async function POST(req) {
  try {
    if (rateLimited(req)) return Response.json({ error: "Too many searches — please wait a minute." }, { status: 429 });
    const body = await req.json().catch(() => ({}));
    const q = String(body.q || "").trim().slice(0, 300);
    const author = AUTHORS.has(body.author) ? body.author : null;
    const forceKind = body.kind === "prayers" ? "prayers" : null; // the Prayers page searches prayers only
    if (q.length < 2) return Response.json({ results: [] });

    // Ruhi book searches: only passages that the book quotes.
    const rb = !forceKind && ruhiBookIn(q);
    if (rb) {
      const topic = rb.rest.length >= 2 ? rb.rest : (RUHI_UNITS[rb.book] || []).join(" ");
      const p = await plan(topic);
      const wordings = [topic, ...p.queries.filter((x) => x.toLowerCase() !== topic.toLowerCase())].slice(0, 3);
      const embs = await embed(wordings);
      const lists = await Promise.all(wordings.map((w, i) => search(w, embs[i], author, null, 50)));
      const inBook = merge(lists).filter((r) => inRuhiBook(r.id, rb.book));
      const results = shapeAll(inBook).slice(0, 12);
      return Response.json({ results, answer: null, type: "ruhi", ruhiBook: rb.book });
    }

    // Quick facts: hand-checked answers to common basics — instant, no AI needed.
    const fact = author || forceKind ? null : matchFact(q);
    if (fact) {
      const [factRows, [emb]] = await Promise.all([byIds(fact.ids), embed([q])]);
      if (factRows.length === fact.ids.length) {
        const more = await search(q, emb, null, null, 15);
        // keep the fact passages first, in order, so [1], [2]… line up
        const seen = new Set(factRows.map((r) => norm(r.text)));
        const rest = merge([more]).filter((r) => !fact.ids.includes(r.id) && !seen.has(norm(r.text)));
        const results = shapeAll([...factRows, ...rest]).slice(0, 12);
        return Response.json({ results, answer: fact.answer, verified: true, type: "fact" });
      }
    }

    const p = await plan(q);
    const wordings = [q, ...p.queries.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 3);
    const embs = await embed(wordings);
    const kind = forceKind || (p.prayers_only ? "prayers" : null);
    let lists = await Promise.all(wordings.map((w, i) => search(w, embs[i], author, kind, 20)));
    if (kind && !forceKind && lists.every((l) => l.length === 0)) {
      lists = await Promise.all(wordings.map((w, i) => search(w, embs[i], author, null, 20)));
    }
    const results = shapeAll(merge(lists)).slice(0, 12);
    const quick = p.type === "fact" && !forceKind ? await answer(q, results) : null;
    return Response.json({ results, answer: quick, type: forceKind ? "prayer" : p.type });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Search is having trouble right now. Please try again." }, { status: 500 });
  }
}
