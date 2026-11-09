"use client";
// Phoenix — read a book of Bahá’u’lláh in two languages side by side (from BahaiPrayers.net).
import { useEffect, useState } from "react";
import { track } from "../lib/track";

const STEP = 30;
const setUrl = (book, a, b) => { const u = new URL(window.location.href); u.searchParams.set("book", book); u.searchParams.set("a", a); u.searchParams.set("b", b); window.history.replaceState({}, "", u); };

export default function Bilingual() {
  const [books, setBooks] = useState(null);
  const [sel, setSel] = useState(null); // { book, a, b }
  const [d, setD] = useState({ status: "idle" });
  const [limit, setLimit] = useState(STEP);

  useEffect(() => {
    fetch("/api/bilingual").then((r) => r.json()).then((j) => {
      const list = j.books || [];
      setBooks(list);
      const p = new URLSearchParams(window.location.search);
      const bk = list.find((x) => x.key === p.get("book")) || list[0];
      if (!bk) return;
      const has = (id) => bk.langs.some((l) => l.id === id);
      const a = has(+p.get("a")) ? +p.get("a") : has(1) ? 1 : bk.langs[0]?.id;
      const bDefault = has(bk.original) && bk.original !== a ? bk.original : bk.langs.find((l) => l.id !== a)?.id;
      const b = has(+p.get("b")) && +p.get("b") !== a ? +p.get("b") : bDefault;
      setSel({ book: bk.key, a, b });
    }).catch(() => setBooks([]));
  }, []);

  useEffect(() => {
    if (!sel || !sel.a || !sel.b) return;
    setUrl(sel.book, sel.a, sel.b);
    setD({ status: "loading" }); setLimit(STEP);
    fetch(`/api/bilingual?book=${sel.book}&a=${sel.a}&b=${sel.b}`).then((r) => r.json())
      .then((j) => { setD(j.error ? { status: "error", error: j.error } : { status: "done", ...j }); if (!j.error) track("read_pair", `${j.book.replace(/^The /, "")}: ${j.nameA} + ${j.nameB}`); })
      .catch(() => setD({ status: "error", error: "Couldn’t load that book right now." }));
  }, [sel]);

  if (books === null) return <><h1>Read side by side</h1><div className="skeleton" /></>;
  if (!books.length) return <><h1>Read side by side</h1><p className="empty">The books aren’t available right now. Please try again later.</p></>;
  const book = books.find((x) => x.key === sel?.book) || books[0];
  const pickBook = (k) => {
    const bk = books.find((x) => x.key === k);
    const has = (id) => bk.langs.some((l) => l.id === id);
    const a = has(sel?.a) ? sel.a : has(1) ? 1 : bk.langs[0].id;
    const b = has(bk.original) && bk.original !== a ? bk.original : has(sel?.b) && sel.b !== a ? sel.b : bk.langs.find((l) => l.id !== a).id;
    setSel({ book: k, a, b });
  };
  const LangSelect = ({ which }) => (
    <select value={sel?.[which] || ""} aria-label={which === "a" ? "First language" : "Second language"}
      onChange={(e) => { const v = +e.target.value; const other = which === "a" ? "b" : "a"; setSel({ ...sel, [which]: v, [other]: sel[other] === v ? sel[which] : sel[other] }); }}>
      {book.langs.map((l) => <option key={l.id} value={l.id}>{l.english}{l.name !== l.english ? ` — \u2068${l.name}\u2069` : ""}</option>)}
    </select>
  );
  return (
    <>
      <h1>Read side by side</h1>
      <p>Bahá’u’lláh’s Writings in two languages, paragraph by paragraph — English beside the original Persian or Arabic, or any two translations. For reading with family and friends in their own language, or for learning one.</p>
      <div className="chips left" role="group" aria-label="Book">
        {books.map((b) => <button key={b.key} className="chip" aria-pressed={b.key === book.key} onClick={() => pickBook(b.key)}>{b.title.replace(/^The /, "")}</button>)}
      </div>
      <div className="bipick">
        <LangSelect which="a" />
        <button className="iconbtn" aria-label="Swap the languages" title="Swap" onClick={() => setSel({ ...sel, a: sel.b, b: sel.a })}>⇄</button>
        <LangSelect which="b" />
      </div>
      <p className="note" style={{ fontSize: 13, marginTop: -4 }}>{book.title} is available in {book.langs.length} languages here.</p>

      {d.status === "loading" && <><div className="skeleton" /><div className="skeleton" /></>}
      {d.status === "error" && <p className="empty">{d.error}</p>}
      {d.status === "done" && (
        <>
          <div className="bihead" aria-hidden="true"><span>{d.nameA}</span><span>{d.nameB}</span></div>
          {d.items.slice(0, limit).map((it, i) => (
            <article key={i} className="birow">
              <div className="binum">{it.n}</div>
              <div className="bicols">
                <div className="bitext" dir={d.rtlA ? "rtl" : "ltr"} dangerouslySetInnerHTML={{ __html: it.a }} />
                <div className="bitext b" dir={d.rtlB ? "rtl" : "ltr"} dangerouslySetInnerHTML={{ __html: it.b }} />
              </div>
            </article>
          ))}
          {d.items.length > limit && <button className="act more" onClick={() => setLimit(limit + STEP)}>Show more ({d.items.length - limit} left)</button>}
          <p className="note" style={{ fontSize: 13 }}>Texts from <a href="https://bahaiprayers.net" target="_blank" rel="noopener noreferrer">BahaiPrayers.net</a>, who share them freely. Translations are the authorized ones each community uses.</p>
        </>
      )}
    </>
  );
}
