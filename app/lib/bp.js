// Phoenix — BahaiPrayers.net's free data feeds (https://bahaiprayers.net/Developer): prayers in over a
// hundred languages, sung versions on YouTube, and books in two languages side by side.
// Fetched on the server and cached for a day.
const BASE = "https://bahaiprayers.net";
const mem = new Map();

export async function bp(path, ttl = 86400) {
  const hit = mem.get(path);
  if (hit && Date.now() - hit.at < ttl * 1000) return hit.data;
  const r = await fetch(BASE + path, { headers: { Accept: "application/json" }, next: { revalidate: ttl } });
  if (!r.ok) throw new Error(`BahaiPrayers.net ${r.status} for ${path}`);
  const data = await r.json();
  if (data && data.ExceptionMessage) throw new Error(`BahaiPrayers.net error for ${path}`);
  mem.set(path, { at: Date.now(), data });
  if (mem.size > 60) mem.delete(mem.keys().next().value);
  return data;
}

export const BP_AUTHORS = { 1: "The Báb", 2: "Bahá’u’lláh", 3: "‘Abdu’l-Bahá" };

// YouTube video id from any YouTube link
export function youtubeId(url) {
  const m = String(url || "").match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

// Keep only simple formatting from their HTML (paragraphs, headings, italics); drop every attribute,
// link, script and style. Text between tags is kept as it is.
const ALLOWED = new Set(["p", "h1", "h2", "h3", "h4", "em", "i", "b", "strong", "br", "sup"]);
export function cleanHtml(html) {
  return String(html || "")
    .replace(/<(script|style|iframe|object|embed|noscript)[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?([a-zA-Z0-9]+)\b[^>]*>/g, (m, tag) => {
      const t = tag.toLowerCase();
      if (!ALLOWED.has(t)) return t === "div" || t === "li" ? (m.startsWith("</") ? "</p>" : "<p>") : "";
      const h = t === "h1" || t === "h2" ? "h3" : t;   // keep headings small
      return m.startsWith("</") ? (h === "br" ? "" : `</${h}>`) : h === "br" ? "<br>" : `<${h}>`;
    })
    .replace(/<p>\s*<\/p>/g, "")
    .replace(/[<>](?![a-z/])/g, (c) => (c === "<" ? "&lt;" : "&gt;"))
    .trim();
}
