// Phoenix — read a book in two languages side by side (BahaiPrayers.net).
// GET → the books and the languages each has. GET ?book=hidden&a=1&b=5 → { items: [{ n, a, b }], … }
import { bp, cleanHtml } from "../../lib/bp";

export const runtime = "nodejs";
export const maxDuration = 30;

const BOOKS = {
  hidden: { title: "The Hidden Words", by: "Bahá’u’lláh", langs: "HiddenLanguages", matrix: "HiddensMatrixByLanguages", original: 5 },
  gleanings: { title: "Gleanings from the Writings of Bahá’u’lláh", by: "Bahá’u’lláh", langs: "GleaningLanguages", matrix: "GleaningsMatrixByLanguages", original: 5 },
  aqdas: { title: "The Kitáb-i-Aqdas", by: "Bahá’u’lláh", langs: "AqdasLanguages", matrix: "AqdasMatrixByLanguages", original: 6 },
  iqan: { title: "The Kitáb-i-Íqán", by: "Bahá’u’lláh", langs: "IqanLanguages", matrix: "IqansMatrixByLanguages", original: 5 },
  tablets: { title: "Tablets of Bahá’u’lláh", by: "Bahá’u’lláh", langs: "TabLanguages", matrix: "TabsMatrixByLanguages", original: 5 },
  pm: { title: "Prayers and Meditations", by: "Bahá’u’lláh", langs: "PMLanguages", matrix: "PMsMatrixByLanguages", original: 4 },
};
const CACHE = { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400" } };

export async function GET(req) {
  const p = new URL(req.url).searchParams;
  try {
    if (!p.get("book")) {
      const books = await Promise.all(Object.entries(BOOKS).map(async ([key, b]) => {
        const langs = await bp(`/api/prayer/${b.langs}`).catch(() => []);
        return { key, title: b.title, by: b.by, original: b.original, langs: langs.map((l) => ({ id: l.Id, name: l.Name, english: l.English, rtl: !l.IsLeftToRight })).sort((x, y) => x.english.localeCompare(y.english)) };
      }));
      return Response.json({ books }, CACHE);
    }
    const B = BOOKS[p.get("book")];
    const a = parseInt(p.get("a"), 10), b = parseInt(p.get("b"), 10);
    if (!B || !a || !b || a === b) return Response.json({ error: "Choose a book and two different languages." }, { status: 400 });
    const rows = await bp(`/api/prayer/${B.matrix}?languageid1=${a}&languageid2=${b}`);
    if (!Array.isArray(rows)) throw new Error("No rows");
    const items = rows.map((r, i) => ({ n: r.Roman || r.Number || i + 1, a: cleanHtml(r.Text1), b: cleanHtml(r.Text2) }))
      .filter((r) => r.a || r.b)
      // their notes and references at the very end are not part of the text
      .filter((r) => !/^<h3>Notes and References|^<h3>Footnotes/i.test(r.a));
    const f = rows[0] || {};
    return Response.json({ book: B.title, nameA: f.LanguageName1 || "", nameB: f.LanguageName2 || "", rtlA: f.IsLeftToRight1 === false, rtlB: f.IsLeftToRight2 === false, items }, CACHE);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "That book isn’t available in those two languages right now." }, { status: 502 });
  }
}
