// Phoenix — checks the AI's Quick answer before anyone sees it.
// The AI is told to use only the passages it is given, but this is where the site makes sure:
//  - every [n] must point at one of the passages the AI was given, and there must be at least one;
//  - every phrase it puts in double quotation marks must appear word-for-word in a passage it cites
//    (a quote shortened with "…" passes if each piece appears, in the same passage).
// If anything fails, the answer is not shown (the passages still are). Returns null when the answer
// is fine, or a short reason when it is not.

const norm = (t) => String(t)
  .normalize("NFC")
  .replace(/[‘’ʼ`´']/g, "'")
  .replace(/[“”„"]/g, '"')
  .replace(/[‐‑‒–—―]/g, "-")
  .replace(/\s+/g, " ")
  .trim()
  .toLowerCase();

// trim punctuation the AI adds around a quotation ("…the world." / ", and")
const edges = (t) => t.replace(/^[\s,.;:!?'"\-]+|[\s,.;:!?'"\-]+$/g, "");

export function citedNumbers(text) {
  return [...String(text).matchAll(/\[(\d+(?:\s*[,–-]\s*\d+)*)\]/g)]
    .flatMap((m) => m[1].split(/\s*[,–-]\s*/).map(Number));
}

export function quotations(text) {
  return [...String(text).matchAll(/“([^”]+)”|"([^"]+)"/g)].map((m) => m[1] ?? m[2]);
}

export function checkAnswer(text, passages) {
  const cites = citedNumbers(text);
  if (!cites.length) return "cites no passage";
  const wrong = cites.filter((n) => !Number.isInteger(n) || n < 1 || n > passages.length);
  if (wrong.length) return `cites passage ${wrong.join(", ")}, but only ${passages.length} were given`;
  // what the AI was shown for each cited passage: its heading (author, book, section) and its words
  const sources = [...new Set(cites)].map((n) => { const r = passages[n - 1]; return norm([r.author, r.book, r.section, r.text].filter(Boolean).join(" \n ")); });
  for (const q of quotations(text)) {
    const pieces = q.split(/\s*(?:…|\.\.\.)\s*/).map((s) => edges(norm(s))).filter((s) => s.length >= 2);
    if (!pieces.length) continue;
    if (!sources.some((src) => pieces.every((p) => src.includes(p)))) return `quotation not found in the passages it cites: “${q.slice(0, 80)}”`;
  }
  return null;
}
