"use client";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { Card, ThemeToggle, Footer, Glass, Arrow } from "./Phoenix";

const DEVO_THEMES = ["Unity", "Service", "Detachment", "Hope", "Gratitude", "Justice", "Healing", "Love of God", "Tests and difficulties", "Children and youth"];

function Header() {
  return (
    <header className="header bar">
      <a className="brand" href="/" style={{ textDecoration: "none" }}><Logo id="hp" />Phoenix</a>
      <nav className="nav"><a href="/">Search</a><a href="/about">About</a><ThemeToggle /></nav>
    </header>
  );
}

function setParams(obj) {
  const u = new URL(window.location.href);
  u.search = "";
  Object.entries(obj).forEach(([k, v]) => v && u.searchParams.set(k, v));
  window.history.pushState({}, "", u);
}

export default function Prayers({ groups }) {
  const [tab, setTab] = useState("browse");
  const [theme, setTheme] = useState(null);
  const [list, setList] = useState({ status: "idle", prayers: [] });
  const [sub, setSub] = useState("");
  const [q, setQ] = useState("");
  const [found, setFound] = useState({ status: "idle", results: [], query: "" });
  const [devTheme, setDevTheme] = useState("");
  const [devo, setDevo] = useState({ status: "idle" });
  const [seed, setSeed] = useState(0);
  const [copied, setCopied] = useState(false);

  const openTheme = async (name, push = true) => {
    setTheme(name); setSub(""); setFound({ status: "idle", results: [], query: "" });
    if (push) setParams({ theme: name });
    setList({ status: "loading", prayers: [] });
    try {
      const j = await fetch(`/api/prayers?theme=${encodeURIComponent(name)}`).then((r) => r.json());
      setList({ status: "done", prayers: j.prayers || [] });
    } catch { setList({ status: "error", prayers: [] }); }
    window.scrollTo({ top: 0 });
  };

  const findPrayer = async (text, push = true) => {
    const t = text.trim();
    if (t.length < 2) return;
    setTheme(null); setQ(t);
    if (push) setParams({ find: t });
    setFound({ status: "loading", results: [], query: t });
    try {
      const r = await fetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q: t, kind: "prayers" }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Search failed");
      setFound({ status: "done", results: j.results || [], query: t });
    } catch (e) { setFound({ status: "error", results: [], query: t, error: e.message }); }
  };

  const build = async (text, s = 0, push = true) => {
    const t = text.trim();
    if (t.length < 2) return;
    setTab("devotional"); setDevTheme(t); setSeed(s); setCopied(false);
    if (push) setParams({ devotional: t });
    setDevo({ status: "loading" });
    try {
      const r = await fetch("/api/devotional", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme: t, seed: s }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Something went wrong");
      setDevo({ status: "done", ...j });
    } catch (e) { setDevo({ status: "error", error: e.message }); }
  };

  useEffect(() => {
    const load = () => {
      const p = new URLSearchParams(window.location.search);
      if (p.get("theme")) { setTab("browse"); openTheme(p.get("theme"), false); }
      else if (p.get("find")) { setTab("browse"); findPrayer(p.get("find"), false); }
      else if (p.get("devotional")) build(p.get("devotional"), 0, false);
      else { setTheme(null); setFound({ status: "idle", results: [], query: "" }); }
    };
    load();
    window.addEventListener("popstate", load);
    return () => window.removeEventListener("popstate", load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const backToThemes = () => { setTheme(null); setFound({ status: "idle", results: [], query: "" }); setQ(""); setParams({}); };

  const copyDevotional = async () => {
    const part = (label, r) => r ? `${label}\n“${r.text}”\n— ${r.author}, ${r.book}${r.section ? ", " + r.section : ""}\n` : "";
    const txt = [`Devotional: ${devo.theme}\n`, part("Opening prayer", devo.opening), ...(devo.readings || []).map((r, i) => part(`Reading ${i + 1}`, r)), part("Closing prayer", devo.closing)].join("\n");
    try { await navigator.clipboard.writeText(txt.trim()); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };

  const subs = [...new Set(list.prayers.map((p) => p.sub).filter(Boolean))];
  const shownPrayers = sub ? list.prayers.filter((p) => (sub === "_main" ? !p.sub : p.sub === sub)) : list.prayers;

  return (
    <>
      <Header />
      <main className="ptop">
        <h1>Prayers &amp; Devotionals</h1>
        <p>Every prayer is shown in full, word for word, from <em>Bahá’í Prayers</em>. Or build a devotional on any theme in one tap.</p>
        <div className="tabs" role="tablist" aria-label="Prayers or devotional">
          <button className="tab" role="tab" aria-selected={tab === "browse"} onClick={() => { setTab("browse"); }}>Browse prayers</button>
          <button className="tab" role="tab" aria-selected={tab === "devotional"} onClick={() => setTab("devotional")}>Build a devotional</button>
        </div>
      </main>

      {tab === "browse" && (
        <section className="results" aria-live="polite">
          <form className="search" role="search" onSubmit={(e) => { e.preventDefault(); findPrayer(q); }} style={{ maxWidth: "none" }}>
            <label htmlFor="pq" className="sr">Find a prayer</label>
            <div className="searchbox small">
              <Glass />
              <input id="pq" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a prayer for… e.g. exams" autoComplete="off" maxLength={200} />
              <button className="go" type="submit" aria-label="Find a prayer" disabled={found.status === "loading"}><Arrow /></button>
            </div>
          </form>

          {(theme || found.status !== "idle") && <button className="back" onClick={backToThemes}>← All themes</button>}

          {!theme && found.status === "idle" && (
            <div className="groups">
              {groups.map((g) => (
                <div className="group" key={g.name}>
                  <h2 className="label">{g.name}</h2>
                  <div className="tgrid">
                    {g.themes.map((t) => (
                      <button key={t.name} className="tcard" onClick={() => openTheme(t.name)}>
                        <span>{t.name}</span><span className="count">{t.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {found.status === "loading" && <><p className="note">Finding prayers…</p><div className="skeleton" /><div className="skeleton" /></>}
          {found.status === "error" && <p className="empty">{found.error}</p>}
          {found.status === "done" && (
            found.results.length === 0
              ? <p className="empty">No prayers found for “{found.query}”. Try other words, or browse the themes.</p>
              : <>
                  <p className="note">Prayers related to “{found.query}”, shown exactly as published.</p>
                  {found.results.map((r) => <Card key={r.id} r={r} />)}
                </>
          )}

          {theme && (
            <>
              <h2 className="serif" style={{ margin: 0, fontWeight: 400, fontSize: 28 }}>{theme}</h2>
              {subs.length > 0 && (
                <div className="chips left" role="group" aria-label="Filter">
                  <button className="chip" aria-pressed={!sub} onClick={() => setSub("")}>All</button>
                  {list.prayers.some((p) => !p.sub) && <button className="chip" aria-pressed={sub === "_main"} onClick={() => setSub("_main")}>{theme}</button>}
                  {subs.map((s) => <button key={s} className="chip" aria-pressed={sub === s} onClick={() => setSub(s)}>{s}</button>)}
                </div>
              )}
              {list.status === "loading" && <><div className="skeleton" /><div className="skeleton" /></>}
              {list.status === "error" && <p className="empty">Couldn’t load these prayers. Please try again.</p>}
              {list.status === "done" && shownPrayers.map((r) => <Card key={r.id} r={r} />)}
            </>
          )}
        </section>
      )}

      {tab === "devotional" && (
        <section className="results" aria-live="polite">
          <form className="search" onSubmit={(e) => { e.preventDefault(); build(devTheme, 0); }} style={{ maxWidth: "none" }}>
            <label htmlFor="dq" className="sr">Devotional theme</label>
            <div className="searchbox small">
              <Glass />
              <input id="dq" value={devTheme} onChange={(e) => setDevTheme(e.target.value)} placeholder="Choose a theme, e.g. hope, service, the family" autoComplete="off" maxLength={120} />
              <button className="go" type="submit" aria-label="Build devotional" disabled={devo.status === "loading"}><Arrow /></button>
            </div>
          </form>
          <div className="chips left" role="group" aria-label="Suggested themes">
            {DEVO_THEMES.map((t) => <button key={t} className="chip" aria-pressed={devo.theme === t} onClick={() => build(t, 0)}>{t}</button>)}
          </div>

          {devo.status === "idle" && <p className="note">Pick a theme and Phoenix will put together an opening prayer, two readings from the Writings of Bahá’u’lláh, the Báb and ‘Abdu’l-Bahá, and a closing prayer, all quoted word for word.</p>}
          {devo.status === "loading" && <><p className="note">Gathering prayers and readings…</p><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></>}
          {devo.status === "error" && <p className="empty">{devo.error}</p>}
          {devo.status === "done" && (
            <div className="dsec">
              <div className="dbar">
                <button className="act primary" onClick={copyDevotional}>{copied ? "Copied" : "Copy whole devotional"}</button>
                <button className="act" onClick={() => build(devo.theme, seed + 1, false)}>Shuffle</button>
              </div>
              {devo.opening && <Card r={devo.opening} label="Opening prayer" />}
              {(devo.readings || []).map((r, i) => <Card key={r.id} r={r} label={`Reading ${i + 1}`} />)}
              {devo.closing && <Card r={devo.closing} label="Closing prayer" />}
            </div>
          )}
        </section>
      )}
      <Footer />
    </>
  );
}
