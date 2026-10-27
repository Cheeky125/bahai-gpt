"use client";
import { useEffect, useRef, useState } from "react";
import Logo from "./Logo";

const AUTHORS = [
  ["", "All authors"],
  ["Bahá’u’lláh", "Bahá’u’lláh"],
  ["The Báb", "The Báb"],
  ["‘Abdu’l-Bahá", "‘Abdu’l-Bahá"],
  ["Shoghi Effendi", "Shoghi Effendi"],
  ["The Universal House of Justice", "Universal House of Justice"],
];
const THEMES = ["Unity of mankind", "Science and religion", "Justice", "Service to others", "Prayers for healing", "Education of children"];

export function Arrow() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>;
}
export function Glass() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--faint)", flex: "none" }}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    setDark(t ? t === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);
  const flip = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("phoenix-theme", next); } catch (e) {}
    setDark(!dark);
  };
  return (
    <button className="iconbtn" onClick={flip} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}>
      {dark
        ? <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
        : <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>}
    </button>
  );
}

function sourceLine(r) {
  const parts = [r.book];
  if (r.section) parts.push(r.section);
  return parts.join(", ") + (r.para ? ` ¶${r.para}` : "");
}

export function Card({ r, n, label }) {
  const [copied, setCopied] = useState(false);
  const long = r.text.length > 1100;
  const [open, setOpen] = useState(!long);
  const copy = async () => {
    const txt = `“${r.text}”\n— ${r.author || "Compilation"}, ${sourceLine(r)}${r.onBehalf ? " (letter written on behalf)" : ""}\n${r.url}`;
    try { await navigator.clipboard.writeText(txt); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch (e) {}
  };
  return (
    <article className="card" id={`p${n}`}>
      {n != null && <span className="num" aria-hidden="true">{n}</span>}
      {label && <div className="label cardlabel">{label}</div>}
      <blockquote className={`quote${open ? "" : " clipped"}`}>{r.text}</blockquote>
      {long && <button className="act more inline" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "Show less" : r.prayer ? "Show full prayer" : "Show full passage"}</button>}
      <div className="meta">
        <div>
          <div className="who">{r.author || "Compilation"}{r.onBehalf ? " (written on behalf)" : ""}</div>
          <div className="src">{sourceLine(r)}</div>
          {r.citation && <div className="cit">{r.citation}</div>}
        </div>
        <div className="actions">
          <button className="act" onClick={copy}>
            <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
            {copied ? "Copied" : "Copy with citation"}
          </button>
          <a className="act link" href={r.url} target="_blank" rel="noopener noreferrer">
            Read on bahai.org
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7" /><path d="M8 7h9v9" /></svg>
          </a>
        </div>
      </div>
    </article>
  );
}

export default function Phoenix() {
  const [q, setQ] = useState("");
  const [author, setAuthor] = useState("");
  const [state, setState] = useState({ status: "idle", results: [], error: null, query: "" });
  const [shown, setShown] = useState(6);
  const inputRef = useRef(null);

  const run = async (query, who = author, push = true) => {
    const text = query.trim();
    if (text.length < 2) return;
    setQ(text);
    setShown(6);
    setState({ status: "loading", results: [], error: null, query: text });
    if (push) {
      const u = new URL(window.location.href);
      u.searchParams.set("q", text);
      who ? u.searchParams.set("author", who) : u.searchParams.delete("author");
      window.history.pushState({}, "", u);
    }
    try {
      const r = await fetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q: text, author: who }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Search failed");
      setState({ status: "done", results: j.results || [], answer: j.answer || null, verified: !!j.verified, error: null, query: text });
    } catch (e) {
      setState({ status: "error", results: [], error: e.message, query: text });
    }
  };

  useEffect(() => {
    const load = () => {
      const p = new URLSearchParams(window.location.search);
      const qq = p.get("q");
      const a = p.get("author") || "";
      setAuthor(a);
      if (qq) run(qq, a, false);
      else { setQ(""); setState({ status: "idle", results: [], error: null, query: "" }); }
    };
    load();
    window.addEventListener("popstate", load);
    return () => window.removeEventListener("popstate", load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickAuthor = (a) => { setAuthor(a); if (state.status !== "idle") run(state.query, a); };
  const submit = (e) => { e.preventDefault(); run(q); };
  const home = () => { window.history.pushState({}, "", "/"); setQ(""); setState({ status: "idle", results: [], error: null, query: "" }); };

  const chips = (
    <div className={`chips${state.status === "idle" ? "" : " left"}`} role="group" aria-label="Filter by author">
      {AUTHORS.map(([v, label]) => (
        <button key={label} className="chip" aria-pressed={author === v} onClick={() => pickAuthor(v)}>{label}</button>
      ))}
    </div>
  );

  if (state.status === "idle") {
    return (
      <>
        <header className="header">
          <button className="brand" onClick={home}><Logo id="h" />Phoenix</button>
          <nav className="nav"><a href="/prayers">Prayers</a><a href="/about">About</a><ThemeToggle /></nav>
        </header>
        <main className="hero">
          <Logo size={128} glow id="hero" />
          <h1>Search the Bahá’í Writings</h1>
          <p>Ask about any theme. Every passage is shown word for word, with its exact source.</p>
          <form className="search" onSubmit={submit} role="search">
            <label htmlFor="q" className="sr">Search the Writings</label>
            <div className="searchbox">
              <Glass />
              <input id="q" ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. What do the Writings say about education?" autoComplete="off" maxLength={300} />
              <button className="go" type="submit" aria-label="Search"><Arrow /></button>
            </div>
            {chips}
          </form>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div className="label">Try a theme</div>
            <div className="themes">
              {THEMES.map((t) => <button key={t} className="theme" onClick={() => run(t)}>{t}</button>)}
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const { status, results, error, query } = state;
  return (
    <>
      <header className="header bar">
        <button className="brand" onClick={home}><Logo id="h2" />Phoenix</button>
        <form onSubmit={submit} role="search" className="hsearch">
          <label htmlFor="q2" className="sr">Search the Writings</label>
          <div className="searchbox small">
            <Glass />
            <input id="q2" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" maxLength={300} />
            <button className="go" type="submit" aria-label="Search" disabled={status === "loading"}><Arrow /></button>
          </div>
        </form>
        <nav className="nav"><a href="/prayers">Prayers</a><a href="/about">About</a><ThemeToggle /></nav>
      </header>
      <main className="results" aria-live="polite">
        {chips}
        {status === "loading" && (<><p className="note">Searching the Writings…</p><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></>)}
        {status === "error" && <p className="empty">{error}</p>}
        {status === "done" && results.length === 0 && (
          <p className="empty">No passages found for “{query}”{author ? ` from ${author}` : ""}. Try different words, or search all authors.</p>
        )}
        {status === "done" && results.length > 0 && (
          <>
            {state.answer && <Answer text={state.answer} verified={state.verified} onCite={(n) => { if (n > shown) setShown(results.length); setTimeout(() => document.getElementById(`p${n}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }} />}
            <p className="note">Passages{author ? ` from ${author}` : " from the Writings"} related to “{query}”, shown exactly as published.</p>
            {results.slice(0, shown).map((r, i) => <Card key={r.id} r={r} n={i + 1} />)}
            {shown < results.length && <button className="act more" onClick={() => setShown(results.length)}>Show {results.length - shown} more</button>}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

function Answer({ text, verified, onCite }) {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <section className="answer" aria-label="Quick answer">
      <div className="answer-label">{verified ? "Quick fact" : "Quick answer"}</div>
      <p className="answer-text">
        {parts.map((p, i) => {
          const m = p.match(/^\[(\d+)\]$/);
          return m ? <button key={i} className="cite" onClick={() => onCite(+m[1])} aria-label={`Go to passage ${m[1]}`}>{m[1]}</button> : <span key={i}>{p}</span>;
        })}
      </p>
      <div className="answer-note">{verified ? "A checked fact, taken from the passages below." : "Written by AI using only the passages below. Always check the passages themselves."}</div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      An independent study tool, not an official publication of any Bahá’í institution.
      Texts from the <a href="https://www.bahai.org/library/" target="_blank" rel="noopener noreferrer">Bahá’í Reference Library</a>.
    </footer>
  );
}
