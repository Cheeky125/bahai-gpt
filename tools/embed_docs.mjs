// Phoenix — pre-computes the meaning vectors for story and song search, so the server doesn't
// re-embed ~700 documents (about 233,000 Voyage tokens) every time it wakes up.
// Run: VOYAGE_API_KEY=... node tools/embed_docs.mjs   → writes app/lib/doc_vectors.json
// The texts are built exactly as in app/lib/engine.js (storyTexts / songTexts). If they ever differ,
// the hash won't match and the server falls back to embedding them itself.
import fs from "fs";
import { createHash } from "crypto";
const read = (f) => JSON.parse(fs.readFileSync(new URL(`../app/lib/${f}`, import.meta.url), "utf8"));
const MEMORIALS = read("stories.json"), DAWN = read("dawnbreakers.json"), SONGS = read("songs.json");
const STORIES = [...MEMORIALS.map((m) => ({ ...m, book: "Memorials of the Faithful" })), ...DAWN];
const storyTexts = STORIES.map((st) => st.book === "The Dawn-Breakers" ? `${st.chapterTitle}. ${st.text.slice(0, 2500)}` : `${st.name}. ${st.text.slice(0, 3000)}`);
const songTexts = SONGS.map((sg) => [sg.title, sg.tags.join(", "), sg.about || ""].join(". "));
const hash = (texts) => createHash("sha256").update(texts.join("\u0000")).digest("hex").slice(0, 16);
async function embed(texts) {
  const out = [];
  for (let i = 0; i < texts.length; i += 96) {
    const r = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ input: texts.slice(i, i + 96), model: "voyage-4", input_type: "document", output_dimension: 1024 }),
    });
    if (!r.ok) throw new Error(`Voyage ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const j = await r.json();
    out.push(...j.data.sort((a, b) => a.index - b.index).map((d) => d.embedding));
  }
  return out;
}
// 8-bit numbers with one scale per vector: about 1 KB per document, accurate enough for ranking.
function pack(vecs) {
  const dim = vecs[0].length, bytes = new Int8Array(vecs.length * dim), scales = [];
  vecs.forEach((v, k) => {
    const m = Math.max(...v.map(Math.abs)) || 1; scales.push(+(m / 127).toPrecision(6));
    v.forEach((x, i) => { bytes[k * dim + i] = Math.round((x / m) * 127); });
  });
  return { dim, scales, data: Buffer.from(bytes.buffer).toString("base64") };
}
const out = {};
for (const [key, texts] of [["stories", storyTexts], ["songs", songTexts]]) {
  out[key] = { hash: hash(texts), count: texts.length, ...pack(await embed(texts)) };
  console.log(key, texts.length, "documents");
}
fs.writeFileSync(new URL("../app/lib/doc_vectors.json", import.meta.url), JSON.stringify(out));
console.log("wrote app/lib/doc_vectors.json");
