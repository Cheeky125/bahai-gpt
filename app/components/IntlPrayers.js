"use client";
// Phoenix — prayers in other languages (BahaiPrayers.net): that language's own themes, every prayer in
// full, right-to-left scripts shown the right way round, and sung versions where there are any.
import { useEffect, useMemo, useState } from "react";
import { Card } from "./Phoenix";

let langsPromise = null;
export const loadLanguages = () => (langsPromise ||= fetch("/api/intl/languages").then((r) => r.json()).then((j) => (Array.isArray(j) ? j : [])).catch(() => { langsPromise = null; return []; }));

export function LanguagePicker({ value, onChange }) {
  const [langs, setLangs] = useState([]);
  useEffect(() => { loadLanguages().then(setLangs); }, []);
  return (
    <label className="langpick">
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>
      <span className="sr">Language</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Language of the prayers">
        <option value="en">English</option>
        {langs.filter((l) => l.id !== 1).map((l) => (
          <option key={l.id} value={String(l.id)}>{l.english}{l.name && l.name !== l.english ? ` — \u2068${l.name}\u2069` : ""} ({l.count})</option>
        ))}
      </select>
    </label>
  );
}

const toCard = (p, d, themeName) => ({
  id: `bp-${d.culture || "x"}-${p.id}`, author: p.author, book: `Prayers in ${d.english}`, section: themeName || null,
  text: p.text, prayer: true, videos: p.videos, rtl: d.rtl, lang: d.culture, url: "https://bahaiprayers.net", source: "BahaiPrayers.net",
});

export default function IntlPrayers({ lang }) {
  const [d, setD] = useState({ status: "loading" });
  const [theme, setTheme] = useState(null);
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(25);
  useEffect(() => {
    setD({ status: "loading" }); setTheme(null); setQ(""); setLimit(25);
    fetch(`/api/intl/prayers?lang=${lang}`).then((r) => r.json())
      .then((j) => setD(j.error ? { status: "error", error: j.error } : { status: "done", ...j }))
      .catch(() => setD({ status: "error", error: "Couldn’t load prayers in that language right now." }));
  }, [lang]);
  const themeName = useMemo(() => (d.themes || []).find((t) => t.id === theme)?.name, [d, theme]);
  const shown = useMemo(() => {
    if (d.status !== "done") return [];
    const words = q.trim().toLocaleLowerCase(d.culture || undefined);
    if (words) return d.prayers.filter((p) => p.text.toLocaleLowerCase(d.culture || undefined).includes(words));
    return theme ? d.prayers.filter((p) => p.themes.includes(theme)) : [];
  }, [d, theme, q]);

  if (d.status === "loading") return <><p className="note">Loading prayers…</p><div className="skeleton" /><div className="skeleton" /></>;
  if (d.status === "error") return <p className="empty">{d.error}</p>;
  const dir = d.rtl ? "rtl" : "ltr";
  const sung = d.prayers.filter((p) => p.videos.length).length;
  return (
    <>
      <div className="searchbox small">
        <input dir="auto" value={q} onChange={(e) => { setQ(e.target.value); setLimit(25); }} placeholder={`Search ${d.prayers.length} prayers in ${d.english}…`} aria-label={`Search prayers in ${d.english}`} lang={d.culture} />
      </div>
      {(theme || q) && <button className="back" onClick={() => { setTheme(null); setQ(""); }}>← All themes</button>}
      {!theme && !q && (
        <>
          <p className="note" style={{ fontSize: 14 }}>{d.prayers.length} prayers in {d.english}{d.language !== d.english ? <> (<bdi lang={d.culture}>{d.language}</bdi>)</> : null}{sung ? `, ${sung} with a sung version` : ""}. Themes as BahaiPrayers.net arranges them in this language.</p>
          <div className="tgrid" dir={dir} lang={d.culture}>
            {d.themes.map((t) => (
              <button key={t.id} className="tcard" onClick={() => { setTheme(t.id); setLimit(25); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                <span>{t.name}</span><span className="count">{t.count}</span>
              </button>
            ))}
          </div>
        </>
      )}
      {theme && !q && <h2 className="serif" dir={dir} lang={d.culture} style={{ margin: 0, fontWeight: 400, fontSize: 28 }}>{themeName}</h2>}
      {q && <p className="note">{shown.length ? `${shown.length} prayer${shown.length > 1 ? "s" : ""} with “${q}”` : `No prayers with “${q}”.`}</p>}
      {shown.slice(0, limit).map((p) => <Card key={p.id} r={toCard(p, d, themeName)} />)}
      {shown.length > limit && <button className="act more" onClick={() => setLimit(limit + 25)}>Show more prayers ({shown.length - limit} left)</button>}
      <p className="note" style={{ fontSize: 13 }}>Prayers in {d.english} from <a href="https://bahaiprayers.net" target="_blank" rel="noopener noreferrer">BahaiPrayers.net</a>, who share their collection freely. Thank you!</p>
    </>
  );
}
