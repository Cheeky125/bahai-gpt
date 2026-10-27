"use client";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import Install from "./Install";
import { Card, ThemeToggle, Footer, Glass, Arrow } from "./Phoenix";

const DEVO_THEMES = ["Unity", "Service", "Detachment", "Hope", "Gratitude", "Justice", "Healing", "Love of God", "Tests and difficulties", "Children and youth"];

function Header() {
  return (
    <header className="header bar">
      <a className="brand" href="/" style={{ textDecoration: "none" }}><Logo id="hp" />Phoenix</a>
      <nav className="nav"><Install /><a href="/">Search</a><a href="/about">About</a><ThemeToggle /></nav>
    </header>
  );
}

function SongCard({ sg, label }) {
  return (
    <article className="card song">
      {label && <div className="label cardlabel">{label}</div>}
      <div>
        <h3 className="songtitle">{sg.title}</h3>
        <div className="src">{[sg.by, sg.lang.join(" / ")].filter(Boolean).join(" · ")}</div>
        {sg.source && <div className="cit">Words from <a href={sg.source.url} target="_blank" rel="noopener noreferrer">{sg.source.book}</a>{sg.source.author ? ` — ${sg.source.author}` : ""}</div>}
      </div>
      {sg.tags.length > 0 && <div className="minitags">{sg.tags.map((t) => <span key={t}>{t}</span>)}</div>}
      <div className="actions">
        <a className="act link" href={sg.url} target="_blank" rel="noopener noreferrer">
          {sg.video ? "Lyrics, chords & video" : "Lyrics & chords"}
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7" /><path d="M8 7h9v9" /></svg>
        </a>
      </div>
    </article>
  );
}

const SONG_TAGS = ["Prayer", "Hidden Word", "Quotation", "Children's Class", "Song"];

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
  const [limit, setLimit] = useState(25);
  const [stories, setStories] = useState({ status: "idle", list: [] });
  const [story, setStory] = useState({ status: "idle" });
  const [sq, setSq] = useState("");
  const [sFound, setSFound] = useState({ status: "idle", results: [], query: "" });
  const [songs, setSongs] = useState({ status: "idle", list: [] });
  const [gq, setGq] = useState("");
  const [gFound, setGFound] = useState({ status: "idle", results: [], query: "" });
  const [gLang, setGLang] = useState("English");
  const [gTag, setGTag] = useState("");

  const openTheme = async (name, push = true) => {
    setTheme(name); setSub(""); setLimit(25); setFound({ status: "idle", results: [], query: "" });
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

  const loadStories = async () => {
    if (stories.status !== "idle") return;
    setStories({ status: "loading", list: [] });
    try { const j = await fetch("/api/stories").then((r) => r.json()); setStories({ status: "done", list: j.stories || [] }); }
    catch { setStories({ status: "error", list: [] }); }
  };
  const openStories = (push = true) => { setTab("stories"); setStory({ status: "idle" }); setSFound({ status: "idle", results: [], query: "" }); loadStories(); if (push) setParams({ tab: "stories" }); };
  const openStory = async (id, push = true) => {
    setTab("stories"); loadStories(); setSFound({ status: "idle", results: [], query: "" });
    if (push) setParams({ story: id });
    setStory({ status: "loading" });
    try { const j = await fetch(`/api/stories?id=${encodeURIComponent(id)}`).then((r) => r.json()); setStory({ status: "done", card: j.story }); }
    catch { setStory({ status: "error" }); }
    window.scrollTo({ top: 0 });
  };
  const findStory = async (text, push = true) => {
    const t = text.trim();
    if (t.length < 2) return;
    setTab("stories"); setStory({ status: "idle" }); setSq(t); loadStories();
    if (push) setParams({ findstory: t });
    setSFound({ status: "loading", results: [], query: t });
    try {
      const r = await fetch("/api/stories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q: t }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Search failed");
      setSFound({ status: "done", results: j.results || [], query: t });
    } catch (e) { setSFound({ status: "error", results: [], query: t, error: e.message }); }
  };

  const loadSongs = async () => {
    if (songs.status !== "idle") return;
    setSongs({ status: "loading", list: [] });
    try { const j = await fetch("/api/songs").then((r) => r.json()); setSongs({ status: "done", list: j.songs || [] }); }
    catch { setSongs({ status: "error", list: [] }); }
  };
  const openSongs = (push = true) => { setTab("songs"); setGFound({ status: "idle", results: [], query: "" }); loadSongs(); if (push) setParams({ tab: "songs" }); };
  const findSong = async (text, push = true) => {
    const t = text.trim();
    if (t.length < 2) return;
    setTab("songs"); setGq(t); loadSongs();
    if (push) setParams({ findsong: t });
    setGFound({ status: "loading", results: [], query: t });
    try {
      const r = await fetch("/api/songs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q: t, all: gLang !== "English" }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Search failed");
      setGFound({ status: "done", results: j.results || [], query: t });
    } catch (e) { setGFound({ status: "error", results: [], query: t, error: e.message }); }
  };

  useEffect(() => {
    const load = () => {
      const p = new URLSearchParams(window.location.search);
      if (p.get("theme")) { setTab("browse"); openTheme(p.get("theme"), false); }
      else if (p.get("find")) { setTab("browse"); findPrayer(p.get("find"), false); }
      else if (p.get("devotional")) build(p.get("devotional"), 0, false);
      else if (p.get("story")) openStory(p.get("story"), false);
      else if (p.get("findstory")) findStory(p.get("findstory"), false);
      else if (p.get("tab") === "stories") openStories(false);
      else if (p.get("findsong")) findSong(p.get("findsong"), false);
      else if (p.get("tab") === "songs") openSongs(false);
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
    const [r1, r2] = devo.readings || [];
    const song = devo.song ? `A song\n${devo.song.title}${devo.song.by ? " — " + devo.song.by : ""}\nLyrics & chords: ${devo.song.url}\n` : "";
    const txt = [`Devotional: ${devo.theme}\n`, part("Opening prayer", devo.opening), part("Reading", r1), part("A story", devo.story), song, part("Reading", r2), part("Closing prayer", devo.closing)].join("\n");
    try { await navigator.clipboard.writeText(txt.trim()); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };

  const subs = [...new Set(list.prayers.map((p) => p.sub).filter(Boolean))];
  const shownPrayers = sub ? list.prayers.filter((p) => (sub === "_main" ? !p.sub : p.sub === sub)) : list.prayers;

  return (
    <>
      <Header />
      <main className="ptop">
        <h1>Prayers, Stories &amp; Songs</h1>
        <p>Nearly 500 prayers, each shown in full, word for word. Stories of the early believers told by ‘Abdu’l-Bahá. Over 300 songs to sing together. Or build a whole devotional on any theme in one tap.</p>
        <div className="tabs" role="tablist" aria-label="Prayers or devotional">
          <button className="tab" role="tab" aria-selected={tab === "browse"} onClick={() => { setTab("browse"); }}>Prayers</button>
          <button className="tab" role="tab" aria-selected={tab === "stories"} onClick={() => openStories()}>Stories</button>
          <button className="tab" role="tab" aria-selected={tab === "songs"} onClick={() => openSongs()}>Songs</button>
          <button className="tab" role="tab" aria-selected={tab === "devotional"} onClick={() => setTab("devotional")}>Devotional</button>
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
              {list.status === "done" && shownPrayers.slice(0, limit).map((r) => <Card key={r.id} r={r} />)}
              {list.status === "done" && shownPrayers.length > limit && <button className="act more" onClick={() => setLimit(limit + 25)}>Show more prayers ({shownPrayers.length - limit} left)</button>}
            </>
          )}
        </section>
      )}

      {tab === "stories" && (
        <section className="results" aria-live="polite">
          <p className="note">From <em>Memorials of the Faithful</em>, ‘Abdu’l-Bahá’s own accounts of early believers, shown word for word.</p>
          <form className="search" role="search" onSubmit={(e) => { e.preventDefault(); findStory(sq); }} style={{ maxWidth: "none" }}>
            <label htmlFor="sq" className="sr">Find a story</label>
            <div className="searchbox small">
              <Glass />
              <input id="sq" value={sq} onChange={(e) => setSq(e.target.value)} placeholder="Find a story about… e.g. courage" autoComplete="off" maxLength={200} />
              <button className="go" type="submit" aria-label="Find a story" disabled={sFound.status === "loading"}><Arrow /></button>
            </div>
          </form>
          {(story.status !== "idle" || sFound.status !== "idle") && <button className="back" onClick={() => openStories()}>← All stories</button>}
          {story.status === "loading" && <div className="skeleton" />}
          {story.status === "error" && <p className="empty">Couldn’t load this story. Please try again.</p>}
          {story.status === "done" && story.card && <Card r={story.card} />}
          {sFound.status === "loading" && <><p className="note">Finding stories…</p><div className="skeleton" /><div className="skeleton" /></>}
          {sFound.status === "error" && <p className="empty">{sFound.error}</p>}
          {sFound.status === "done" && <><p className="note">Stories related to “{sFound.query}”.</p>{sFound.results.map((r) => <Card key={r.id} r={r} />)}</>}
          {story.status === "idle" && sFound.status === "idle" && (
            stories.status === "loading" ? <div className="skeleton" /> :
            <div className="tgrid">
              {stories.list.map((st) => (
                <button key={st.id} className="tcard" onClick={() => openStory(st.id)} title={st.preview}>
                  <span>{st.name}</span><span className="count">{st.n}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "songs" && (
        <section className="results" aria-live="polite">
          <p className="note">From the <a href="https://www.bahaisongproject.com" target="_blank" rel="noopener noreferrer">bahá’í song project</a>. Tap a song for its lyrics, chords and video on their site. The songs belong to their artists.</p>
          <form className="search" role="search" onSubmit={(e) => { e.preventDefault(); findSong(gq); }} style={{ maxWidth: "none" }}>
            <label htmlFor="gq" className="sr">Find a song</label>
            <div className="searchbox small">
              <Glass />
              <input id="gq" value={gq} onChange={(e) => setGq(e.target.value)} placeholder="Find a song about… e.g. unity" autoComplete="off" maxLength={200} />
              <button className="go" type="submit" aria-label="Find a song" disabled={gFound.status === "loading"}><Arrow /></button>
            </div>
          </form>
          <div className="chips left" role="group" aria-label="Language">
            {["English", "All languages"].map((l) => <button key={l} className="chip" aria-pressed={gLang === l} onClick={() => setGLang(l)}>{l}</button>)}
            <span style={{ width: 8 }} />
            {SONG_TAGS.map((t) => <button key={t} className="chip" aria-pressed={gTag === t} onClick={() => { setGTag(gTag === t ? "" : t); setGFound({ status: "idle", results: [], query: "" }); }}>{t}</button>)}
          </div>
          {gFound.status !== "idle" && <button className="back" onClick={() => { setGFound({ status: "idle", results: [], query: "" }); setGq(""); setParams({ tab: "songs" }); }}>← All songs</button>}
          {gFound.status === "loading" && <><p className="note">Finding songs…</p><div className="skeleton" /></>}
          {gFound.status === "error" && <p className="empty">{gFound.error}</p>}
          {gFound.status === "done" && <><p className="note">Songs related to “{gFound.query}”.</p>{gFound.results.map((sg) => <SongCard key={sg.slug} sg={sg} />)}</>}
          {gFound.status === "idle" && (songs.status === "loading" ? <div className="skeleton" /> : (() => {
            const list = songs.list.filter((sg) => (gLang === "English" ? sg.lang.includes("English") : true) && (!gTag || sg.tags.includes(gTag)));
            return (<>
              <p className="note">{list.length} songs</p>
              <div className="songlist">
                {list.map((sg) => (
                  <a key={sg.slug} className="songrow" href={sg.url} target="_blank" rel="noopener noreferrer">
                    <span className="st">{sg.title}</span>
                    <span className="sm">{[sg.by, gLang !== "English" ? sg.lang.join(" / ") : null].filter(Boolean).join(" · ")}</span>
                  </a>
                ))}
              </div>
            </>);
          })())}
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

          {devo.status === "idle" && <p className="note">Pick a theme and Phoenix will put together an opening prayer, readings from the Writings of Bahá’u’lláh, the Báb and ‘Abdu’l-Bahá, a story of one of the early believers, a song to sing together, and a closing prayer.</p>}
          {devo.status === "loading" && <><p className="note">Gathering prayers and readings…</p><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></>}
          {devo.status === "error" && <p className="empty">{devo.error}</p>}
          {devo.status === "done" && (
            <div className="dsec">
              <div className="dbar">
                <button className="act primary" onClick={copyDevotional}>{copied ? "Copied" : "Copy whole devotional"}</button>
                <button className="act" onClick={() => build(devo.theme, seed + 1, false)}>Shuffle</button>
              </div>
              {devo.opening && <Card r={devo.opening} label="Opening prayer" />}
              {devo.readings?.[0] && <Card r={devo.readings[0]} label="Reading" />}
              {devo.story && <Card r={devo.story} label="A story" />}
              {devo.song && <SongCard sg={devo.song} label="A song" />}
              {devo.readings?.[1] && <Card r={devo.readings[1]} label="Reading" />}
              {devo.closing && <Card r={devo.closing} label="Closing prayer" />}
            </div>
          )}
        </section>
      )}
      <Footer />
    </>
  );
}
