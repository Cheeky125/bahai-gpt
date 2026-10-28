"use client";
// Phoenix — Ruhi study page. Study circle mode goes through a unit section by section, showing only the
// words each section quotes from the Writings, cut exactly where the book cuts them. Practice mode helps
// memorize those quotes (first words, fill in the blanks, first letters). Progress stays on this device.
import { useCallback, useEffect, useMemo, useState } from "react";

const MEM_KEY = "phoenix-ruhi-mem";
const LAST_KEY = "phoenix-ruhi-last";
const readJSON = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v ?? d; } catch (e) { return d; } };
const writeJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

function useMemorized() {
  const [mem, setMem] = useState({});
  useEffect(() => { setMem(readJSON(MEM_KEY, {})); }, []);
  const toggle = useCallback((key) => {
    setMem((m) => {
      const next = { ...m };
      if (next[key]) delete next[key]; else next[key] = Date.now();
      writeJSON(MEM_KEY, next);
      return next;
    });
  }, []);
  return [mem, toggle];
}
const countIn = (mem, b, u) => Object.keys(mem).filter((k) => k.startsWith(`${b}.${u}.`)).length;

function setUrl(params, push) {
  const u = new URL(window.location.href);
  for (const k of ["b", "u", "s", "mode"]) params[k] != null && params[k] !== "" ? u.searchParams.set(k, params[k]) : u.searchParams.delete(k);
  window.history[push ? "pushState" : "replaceState"]({}, "", u);
}

function Ext() {
  return <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7" /><path d="M8 7h9v9" /></svg>;
}
function Check({ on }) {
  return on
    ? <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg>
    : <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="8" /></svg>;
}
function Bar({ n, of }) {
  return <div className="membar" aria-hidden="true"><span style={{ width: `${of ? Math.round((n / of) * 100) : 0}%` }} /></div>;
}

// ---------- Book list ----------
function BookList({ books, later, mem, open }) {
  const [last, setLast] = useState(null);
  useEffect(() => { setLast(readJSON(LAST_KEY, null)); }, []);
  const lastBook = last && books.find((b) => b.n === last.b);
  const lastUnit = lastBook && lastBook.units[last.u - 1];
  return (
    <>
      <h1>Ruhi Institute</h1>
      <p>Pick a unit to go through the quotes from the Writings section by section, just as your study circle does — exactly as the book quotes them. Then practise memorizing them.</p>
      {lastUnit && (
        <button className="continue" onClick={() => open(last.b, last.u, last.s, last.mode)}>
          <span className="label">Continue</span>
          <span>Book {last.b} · {lastUnit.title}{last.s ? ` · Section ${last.s}` : ""}</span>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
        </button>
      )}
      <div className="books">
        {books.map((b) => (
          <details key={b.n} className="book" open={lastBook ? lastBook.n === b.n : b.n === 1}>
            <summary>
              <span className="booknum">Book {b.n}</span>
              <span className="booktitle">{b.title}</span>
            </summary>
            <div className="bookbody">
              {b.units.map((u, i) => {
                const done = countIn(mem, b.n, i + 1);
                return (
                  <button key={u.title} className="unitrow" onClick={() => open(b.n, i + 1)} disabled={!u.count}>
                    <span className="unitnum">Unit {i + 1}</span>
                    <span className="unitname">{u.title}</span>
                    <span className="unitcount">{u.count ? `${u.count} quotes${done ? ` · ${done} memorized` : ""}` : "No quotes found"}</span>
                    {done > 0 && <Bar n={done} of={u.count} />}
                  </button>
                );
              })}
              <a className="act link" href={b.pdf} target="_blank" rel="noopener noreferrer" style={{ alignSelf: "flex-start" }}>Get Book {b.n} free on ruhi.org <Ext /></a>
            </div>
          </details>
        ))}
        <div className="laterbooks">
          <div className="label">Later books</div>
          <p className="note">{later.map(([n, t]) => `Book ${n}: ${t}`).join(" · ")}. These are pre-publication or still in development; see <a href="https://www.ruhi.org/en/walking-a-path-of-service" target="_blank" rel="noopener noreferrer">ruhi.org</a>.</p>
        </div>
      </div>
      <p className="note" style={{ fontSize: 13 }}>Book and unit titles are those published by the Ruhi Institute. Phoenix is not affiliated with the Ruhi Institute and does not reproduce its materials: it only records which words of the Writings each section quotes, and shows those words from the Bahá’í Reference Library. The explanations and exercises are in the books themselves.</p>
    </>
  );
}

// ---------- One quote, as the book quotes it ----------
function Who({ q }) {
  return (
    <div className="ruhiwho">
      <span className="who">{q.author || "Compilation"}</span>
      <span className="src">{q.book}{q.source && q.source !== q.book ? `, ${q.source}` : ""}</span>
    </div>
  );
}

function StudyQuote({ q, mem, toggle }) {
  const [full, setFull] = useState(false);
  const differs = q.full.trim() !== q.excerpt.trim();
  return (
    <article className="card ruhiq">
      <blockquote className="quote big">{q.excerpt}</blockquote>
      <Who q={q} />
      <div className="actions left">
        <button className={`act${mem[q.key] ? " on" : ""}`} aria-pressed={!!mem[q.key]} onClick={() => toggle(q.key)}><Check on={!!mem[q.key]} />{mem[q.key] ? "Memorized" : "Mark as memorized"}</button>
        {differs && <button className="act" aria-expanded={full} onClick={() => setFull(!full)}>{full ? "Hide the full passage" : "Show the full passage"}</button>}
        <a className="act link" href={q.url} target="_blank" rel="noopener noreferrer">bahai.org <Ext /></a>
      </div>
      {full && <div className="fullpassage"><div className="label">The whole passage in the Writings</div><p>{q.full}</p></div>}
    </article>
  );
}

// ---------- Study circle mode ----------
function Study({ data, s, go, mem, toggle, nextUnit }) {
  const sec = data.sections[s - 1];
  const withQuotes = data.sections.filter((x) => x.quotes.length).map((x) => x.section);
  const prev = [...withQuotes].reverse().find((n) => n < s);
  const next = withQuotes.find((n) => n > s);
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest("input,textarea,select")) return;
      if (e.key === "ArrowRight" && next) go(next);
      if (e.key === "ArrowLeft" && prev) go(prev);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, go]);
  if (!sec) return null;
  return (
    <>
      <div className="sectstrip" role="tablist" aria-label="Sections">
        {data.sections.map((x) => (
          <button key={x.section} role="tab" aria-selected={x.section === s} className={`sbtn${x.quotes.length ? "" : " nq"}`} onClick={() => go(x.section)}
            aria-label={`Section ${x.section}${x.quotes.length ? `, ${x.quotes.length} quote${x.quotes.length > 1 ? "s" : ""}` : ", no quotes"}`}>
            {x.section}
          </button>
        ))}
      </div>
      <div className="secthead">
        <h2 className="serif">Section {s}</h2>
        <span className="note">{sec.quotes.length ? `${sec.quotes.length} quote${sec.quotes.length > 1 ? "s" : ""}` : ""}</span>
      </div>
      {sec.quotes.length === 0 && <p className="empty" style={{ textAlign: "left", padding: "8px 0" }}>This section doesn’t quote the Writings — it’s the book’s own explanation and exercises.</p>}
      {sec.quotes.map((q) => <StudyQuote key={q.key} q={q} mem={mem} toggle={toggle} />)}
      <div className="sectnav">
        {prev ? <button className="act" onClick={() => go(prev)}>‹ Section {prev}</button> : <span />}
        {next ? <button className="act primary" onClick={() => go(next)}>Section {next} ›</button>
          : nextUnit ? <button className="act primary" onClick={nextUnit.open}>Next: Unit {nextUnit.u} ›</button> : <span />}
      </div>
    </>
  );
}

// ---------- Practice mode ----------
const LEVELS = [
  ["first", "First words"],
  ["few", "A few blanks"],
  ["many", "Many blanks"],
  ["letters", "First letters"],
];
function tokenize(text) {
  return text.split(/(\s+)/).filter((t) => t !== "").map((t) => {
    if (/^\s+$/.test(t)) return { space: t };
    const m = t.match(/^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u);
    return { pre: m[1], core: m[2], post: m[3] };
  });
}
const rand = (i, seed) => { const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453; return x - Math.floor(x); };

function PracticeCard({ q, level, mem, toggle }) {
  const [seed, setSeed] = useState(1);
  const [shown, setShown] = useState(() => new Set());
  const [upTo, setUpTo] = useState(4);
  const toks = useMemo(() => tokenize(q.excerpt), [q.excerpt]);
  const words = toks.map((t, i) => (t.core ? i : -1)).filter((i) => i >= 0);
  useEffect(() => { setShown(new Set()); setUpTo(4); }, [q.key, level, seed]);
  const hidden = useMemo(() => {
    const h = new Set();
    if (level === "first") words.forEach((i, n) => { if (n >= upTo) h.add(i); });
    else if (level === "letters") words.forEach((i) => h.add(i));
    else {
      const ratio = level === "few" ? 0.3 : 0.6;
      words.forEach((i) => { if (toks[i].core.length > 2 && rand(i, seed) < ratio) h.add(i); });
      if (!h.size && words.length) h.add(words[Math.floor(words.length / 2)]);
    }
    return h;
  }, [level, upTo, seed, q.key]); // eslint-disable-line react-hooks/exhaustive-deps
  const remaining = [...hidden].filter((i) => !shown.has(i)).length;
  const reveal = (i) => setShown((s) => new Set(s).add(i));
  const revealAll = () => level === "first" ? setUpTo(words.length) : setShown(new Set(hidden));
  const firstLimit = level === "first" ? words[upTo] : -1; // in "first words", stop drawing at the first hidden word
  return (
    <article className="card ruhiq">
      <blockquote className="quote big practice" aria-live="polite">
        {toks.map((t, i) => {
          if (level === "first" && firstLimit != null && firstLimit >= 0 && i >= firstLimit) return null;
          if (t.space) return t.space;
          if (!t.core) return <span key={i}>{t.pre}{t.post}</span>;
          if (!hidden.has(i) || shown.has(i)) return <span key={i} className={shown.has(i) ? "revealed" : ""}>{t.pre}{t.core}{t.post}</span>;
          const hint = level === "letters" ? t.core[0] : "";
          return (
            <span key={i}>{t.pre}<button className="blank" onClick={() => reveal(i)} aria-label="Reveal this word" style={{ minWidth: `${Math.max(1.6, t.core.length * 0.5)}em` }}>{hint}</button>{t.post}</span>
          );
        })}
        {level === "first" && upTo < words.length && <span className="faint"> …</span>}
      </blockquote>
      <div className="actions left">
        {level === "first" && upTo < words.length && <button className="act" onClick={() => setUpTo(upTo + 1)}>Next word</button>}
        {remaining > 0 || (level === "first" && upTo < words.length)
          ? <button className="act" onClick={revealAll}>Show the whole quote</button>
          : <span className="note" style={{ alignSelf: "center", fontSize: 14 }}>All shown</span>}
        {(level === "few" || level === "many") && <button className="act" onClick={() => setSeed(seed + 1)}>New blanks</button>}
        <button className={`act${mem[q.key] ? " on" : ""}`} aria-pressed={!!mem[q.key]} onClick={() => toggle(q.key)}><Check on={!!mem[q.key]} />{mem[q.key] ? "Memorized" : "I’ve memorized this"}</button>
      </div>
      <Who q={q} />
    </article>
  );
}

function Practice({ data, mem, toggle, startSection }) {
  const all = useMemo(() => data.sections.flatMap((s) => s.quotes.map((q) => ({ ...q, section: s.section }))), [data]);
  const [level, setLevel] = useState("first");
  const [skipDone, setSkipDone] = useState(false);
  const list = skipDone ? all.filter((q) => !mem[q.key]) : all;
  const [i, setI] = useState(() => Math.max(0, all.findIndex((q) => q.section >= (startSection || 1))));
  const idx = Math.min(i, Math.max(0, list.length - 1));
  const q = list[idx];
  useEffect(() => { try { setLevel(localStorage.getItem("phoenix-ruhi-level") || "first"); } catch (e) {} }, []);
  const pickLevel = (l) => { setLevel(l); try { localStorage.setItem("phoenix-ruhi-level", l); } catch (e) {} };
  return (
    <>
      <div className="chips left" role="group" aria-label="How much to hide">
        {LEVELS.map(([k, t]) => <button key={k} className="chip" aria-pressed={level === k} onClick={() => pickLevel(k)}>{t}</button>)}
      </div>
      <label className="skipdone"><input type="checkbox" checked={skipDone} onChange={(e) => { setSkipDone(e.target.checked); setI(0); }} /> Skip the ones I’ve memorized</label>
      {!q ? (
        <p className="empty" style={{ textAlign: "left" }}>You’ve memorized every quote in this unit. Wonderful!</p>
      ) : (
        <>
          <div className="secthead">
            <span className="label">Quote {idx + 1} of {list.length} · Section {q.section}</span>
          </div>
          <PracticeCard key={q.key} q={q} level={level} mem={mem} toggle={toggle} />
          <div className="sectnav">
            {idx > 0 ? <button className="act" onClick={() => setI(idx - 1)}>‹ Previous</button> : <span />}
            {idx < list.length - 1 ? <button className="act primary" onClick={() => setI(idx + 1)}>Next quote ›</button> : <span />}
          </div>
        </>
      )}
    </>
  );
}

// ---------- Page ----------
export default function RuhiStudy({ books, later }) {
  const [view, setView] = useState({ b: null });
  const [data, setData] = useState({ status: "idle" });
  const [mem, toggle] = useMemorized();

  const readUrl = useCallback(() => {
    const p = new URLSearchParams(window.location.search);
    const b = parseInt(p.get("b"), 10), u = parseInt(p.get("u"), 10), s = parseInt(p.get("s"), 10);
    setView(b && u ? { b, u, s: s || null, mode: p.get("mode") === "practice" ? "practice" : "study" } : { b: null });
  }, []);
  useEffect(() => {
    readUrl();
    window.addEventListener("popstate", readUrl);
    return () => window.removeEventListener("popstate", readUrl);
  }, [readUrl]);

  useEffect(() => {
    if (!view.b) return;
    const key = `${view.b}.${view.u}`;
    if (data.key === key) return;
    setData({ status: "loading", key });
    fetch(`/api/ruhi?b=${view.b}&u=${view.u}`).then((r) => r.json())
      .then((j) => setData(j.error ? { status: "error", key } : { status: "done", key, ...j }))
      .catch(() => setData({ status: "error", key }));
  }, [view.b, view.u]); // eslint-disable-line react-hooks/exhaustive-deps

  // first section with quotes, if none was chosen
  const s = view.s || (data.status === "done" ? (data.sections.find((x) => x.quotes.length) || { section: 1 }).section : 1);
  useEffect(() => {
    if (view.b && data.status === "done") writeJSON(LAST_KEY, { b: view.b, u: view.u, s, mode: view.mode });
  }, [view.b, view.u, s, view.mode, data.status]);

  const open = (b, u, sec, mode) => {
    const v = { b, u, s: sec || null, mode: mode || "study" };
    setView(v); setUrl({ b, u, s: sec, mode: mode === "practice" ? "practice" : null }, true);
    window.scrollTo(0, 0);
  };
  const go = useCallback((sec) => {
    setView((v) => ({ ...v, s: sec }));
    setUrl({ b: view.b, u: view.u, s: sec, mode: null }, false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view.b, view.u]);
  const setMode = (mode) => {
    setView((v) => ({ ...v, mode }));
    setUrl({ b: view.b, u: view.u, s, mode: mode === "practice" ? "practice" : null }, false);
  };
  const home = () => { setView({ b: null }); setUrl({}, true); window.scrollTo(0, 0); };

  if (!view.b) return <BookList books={books} later={later} mem={mem} open={open} />;

  const book = books.find((x) => x.n === view.b);
  const unit = book?.units[view.u - 1];
  const nu = book?.units[view.u] ? { u: view.u + 1, open: () => open(view.b, view.u + 1) } : null;
  const total = data.status === "done" ? data.sections.reduce((n, x) => n + x.quotes.length, 0) : unit?.count || 0;
  const done = countIn(mem, view.b, view.u);
  return (
    <>
      <button className="back" onClick={home}>← All books</button>
      <div>
        <div className="label" style={{ color: "var(--accentText)" }}>Book {view.b} · Unit {view.u}</div>
        <h1 style={{ marginTop: 4 }}>{unit ? unit.title : "Ruhi unit"}</h1>
        {book && <p className="note" style={{ marginTop: 4 }}><em>{book.title}</em></p>}
      </div>
      <div className="unitbar">
        <div className="tabs" role="tablist">
          <button className="tab" role="tab" aria-selected={view.mode !== "practice"} onClick={() => setMode("study")}>Study circle</button>
          <button className="tab" role="tab" aria-selected={view.mode === "practice"} onClick={() => setMode("practice")}>Practice</button>
        </div>
        {total > 0 && <div className="memcount"><span>{done} of {total} memorized</span><Bar n={done} of={total} /></div>}
      </div>
      {data.status === "loading" && <><div className="skeleton" /><div className="skeleton" /></>}
      {data.status === "error" && <p className="empty">Couldn’t load that unit. Please try again.</p>}
      {data.status === "done" && (view.mode === "practice"
        ? <Practice key={data.key} data={data} mem={mem} toggle={toggle} startSection={view.s} />
        : <Study data={data} s={s} go={go} mem={mem} toggle={toggle} nextUnit={nu} />)}
    </>
  );
}
