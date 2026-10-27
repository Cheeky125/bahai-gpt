"use client";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import Install from "./Install";
import { Card, ThemeToggle, Footer } from "./Phoenix";

const BOOK_TITLES = { 1: "Reflections on the Life of the Spirit", 2: "Arising to Serve", 3: "Teaching Children’s Classes, Grade 1", 4: "The Twin Manifestations", 5: "Releasing the Powers of Junior Youth", 6: "Teaching the Cause", 7: "Walking Together on a Path of Service", 8: "The Covenant of Bahá’u’lláh" };

export default function RuhiUnit() {
  const [st, setSt] = useState({ status: "loading" });
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const b = p.get("b"), u = p.get("u");
    fetch(`/api/ruhi?b=${encodeURIComponent(b)}&u=${encodeURIComponent(u)}`).then((r) => r.json())
      .then((j) => setSt(j.error ? { status: "error" } : { status: "done", ...j }))
      .catch(() => setSt({ status: "error" }));
  }, []);
  useEffect(() => {
    if (st.status === "done" && window.location.hash) setTimeout(() => document.querySelector(window.location.hash)?.scrollIntoView({ block: "start" }), 100);
  }, [st.status]);
  const total = st.sections ? st.sections.reduce((n, s) => n + s.cards.length, 0) : 0;
  return (
    <>
      <header className="header bar">
        <a className="brand" href="/" style={{ textDecoration: "none" }}><Logo id="ru" />Phoenix</a>
        <nav className="nav"><Install /><a href="/">Search</a><a href="/institute">Institute</a><ThemeToggle /></nav>
      </header>
      <main className="results">
        <a className="back" href="/institute" style={{ textDecoration: "none" }}>← Institute companion</a>
        {st.status === "loading" && <><div className="skeleton" /><div className="skeleton" /></>}
        {st.status === "error" && <p className="empty">Couldn’t find that unit.</p>}
        {st.status === "done" && (
          <>
            <div>
              <div className="label" style={{ color: "var(--accentText)" }}>Ruhi Book {st.book} · Unit {st.unit}</div>
              <h1 className="serif" style={{ fontWeight: 400, margin: "6px 0 4px", fontSize: "clamp(26px,5vw,34px)" }}>{st.unitTitle}</h1>
              <p className="note">The {total} passages from the Writings quoted in this unit of <em>{BOOK_TITLES[st.book]}</em>, in section order, shown word for word from the Bahá’í Reference Library. The book itself, with its explanations and exercises, is free from <a href="https://www.ruhi.org/en/materials-in-your-language" target="_blank" rel="noopener noreferrer">ruhi.org</a>.</p>
            </div>
            {st.sections.map((s) => (
              <section key={s.section} id={`s${s.section}`} style={{ display: "flex", flexDirection: "column", gap: 12, scrollMarginTop: 16 }}>
                <h2 className="label" style={{ margin: "8px 0 0" }}>Section {s.section}</h2>
                {s.cards.map((r) => <Card key={r.id} r={r} hideRuhi />)}
              </section>
            ))}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
