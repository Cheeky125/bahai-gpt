"use client";
// Phoenix — Today: the Bahá’í date, the morning and evening reading, the next Feast and Holy Days,
// and sunrise/sunset (for the Fast) where you are.
import { useEffect, useState } from "react";
import { Card, Icon } from "./Phoenix";
import { useSaved } from "./Saved";
import { badiDate, badiString, upcoming, holyDays, fast, ymd, toKey, daysBetween, fmtDate, addDays } from "../lib/badi";
import { sunTimes, todayIn, fmtTime } from "../lib/sun";

const PLACE_KEY = "phoenix-place";
const getPlace = () => { try { return JSON.parse(localStorage.getItem(PLACE_KEY) || "null"); } catch (e) { return null; } };
const setPlaceStore = (p) => { try { p ? localStorage.setItem(PLACE_KEY, JSON.stringify(p)) : localStorage.removeItem(PLACE_KEY); } catch (e) {} };
const devotional = (theme) => `/prayers?devotional=${encodeURIComponent(theme)}`;
const inDays = (n) => (n === 0 ? "today" : n === 1 ? "tomorrow" : `in ${n} days`);

function useToday() {
  const [t, setT] = useState(null);
  useEffect(() => {
    const upd = () => { const [y, m, d] = todayIn(); setT(ymd(y, m, d)); };
    upd();
    const id = setInterval(upd, 60000);
    return () => clearInterval(id);
  }, []);
  return t;
}

// ---------- Sunrise / sunset ----------
function Place({ place, setPlace }) {
  const [mode, setMode] = useState(null); // null | "city" | "locating"
  const [q, setQ] = useState("");
  const [res, setRes] = useState({ status: "idle", list: [] });
  const [err, setErr] = useState("");
  const locate = () => {
    if (!navigator.geolocation) { setErr("Location isn’t available here — type your city instead."); setMode("city"); return; }
    setMode("locating"); setErr("");
    navigator.geolocation.getCurrentPosition(
      (p) => { const pl = { name: "Your location", lat: +p.coords.latitude.toFixed(2), lon: +p.coords.longitude.toFixed(2), tz: Intl.DateTimeFormat().resolvedOptions().timeZone }; setPlace(pl); setMode(null); },
      () => { setErr("Couldn’t get your location — type your city instead."); setMode("city"); },
      { timeout: 15000, maximumAge: 86400000 },
    );
  };
  const search = async (e) => {
    e.preventDefault();
    if (q.trim().length < 2) return;
    setRes({ status: "loading", list: [] });
    try {
      const j = await fetch(`/api/geocode?q=${encodeURIComponent(q.trim())}`).then((r) => r.json());
      setRes({ status: "done", list: j.results || [] });
    } catch (e) { setRes({ status: "error", list: [] }); }
  };
  if (mode === "city") {
    return (
      <div className="placepick">
        <form onSubmit={search} className="searchbox small">
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Your city, e.g. Toronto" aria-label="City" maxLength={80} />
          <button className="go" type="submit" aria-label="Find city">→</button>
        </form>
        {err && <p className="note" style={{ fontSize: 14 }}>{err}</p>}
        {res.status === "loading" && <p className="note">Looking…</p>}
        {res.status === "error" && <p className="note">City search isn’t working right now.</p>}
        {res.status === "done" && !res.list.length && <p className="note">No city found by that name.</p>}
        {res.list.map((c) => (
          <button key={`${c.lat},${c.lon}`} className="unitrow" style={{ gridTemplateColumns: "1fr" }} onClick={() => { setPlace({ name: [c.name, c.region, c.country].filter(Boolean).join(", "), lat: c.lat, lon: c.lon, tz: c.tz }); setMode(null); }}>
            <span className="unitname" style={{ fontSize: 16 }}>{c.name}</span>
            <span className="unitcount" style={{ gridColumn: 1 }}>{[c.region, c.country].filter(Boolean).join(", ")}</span>
          </button>
        ))}
        <button className="act link" style={{ alignSelf: "flex-start" }} onClick={() => setMode(null)}>Cancel</button>
      </div>
    );
  }
  return (
    <div className="actions left">
      <button className="act primary" onClick={locate} disabled={mode === "locating"}>{mode === "locating" ? "Finding you…" : "Use my location"}</button>
      <button className="act" onClick={() => { setMode("city"); setErr(""); }}>{place ? "Change city" : "Type a city"}</button>
      {place && <button className="act link" onClick={() => setPlace(null)}>Forget</button>}
    </div>
  );
}

function SunCard({ t, place, setPlace, fastNow, fastNext }) {
  let sun = null;
  if (place) {
    const [y, m, d] = todayIn(place.tz);
    sun = { ...sunTimes(y, m, d, place.lat, place.lon), tz: place.tz };
  }
  return (
    <section className="tcard2">
      <div className="tlabel"><Icon name="today" size={18} /> {fastNow ? `The Fast — day ${fastNow.day} of 19` : "Sunrise & sunset"}</div>
      {sun ? (
        <>
          <div className="suntimes">
            <div><span className="label">{fastNow ? "Fast begins" : "Sunrise"}</span><span className="big">{fmtTime(sun.sunrise, sun.tz)}</span></div>
            <div><span className="label">{fastNow ? "Fast ends" : "Sunset"}</span><span className="big">{fmtTime(sun.sunset, sun.tz)}</span></div>
          </div>
          <p className="note" style={{ fontSize: 14 }}>{place.name}{fastNow ? " · from sunrise to sunset" : " · the next Bahá’í day begins at sunset"}</p>
        </>
      ) : (
        <p className="note" style={{ fontSize: 15 }}>See today’s sunrise and sunset where you are — the times of the Fast, and when each Feast and Holy Day begins. Your place is saved only on this device.</p>
      )}
      <Place place={place} setPlace={setPlace} />
      {!fastNow && fastNext && <p className="note" style={{ fontSize: 14 }}>The Fast: {fmtDate(fastNext.start, { day: "numeric", month: "long" })} – {fmtDate(fastNext.end, { day: "numeric", month: "long", year: "numeric" })} ({inDays(daysBetween(t, fastNext.start))}).</p>}
    </section>
  );
}

// ---------- Readings ----------
function Readings({ t }) {
  const [st, setSt] = useState({ status: "loading" });
  const [hour, setHour] = useState(9);
  useEffect(() => {
    setHour(new Date().getHours());
    fetch(`/api/today?d=${toKey(t)}`).then((r) => r.json())
      .then((j) => setSt(j.morning ? { status: "done", ...j } : { status: "error" }))
      .catch(() => setSt({ status: "error" }));
  }, [t]);
  if (st.status === "loading") return <><div className="skeleton" /><div className="skeleton" /></>;
  if (st.status === "error") return <p className="note">Couldn’t load today’s reading. Please try again later.</p>;
  const items = [["Morning reading", st.morning], ["Evening reading", st.evening]].filter(([, r]) => r);
  if (hour >= 15) items.reverse();
  return items.map(([label, r]) => <Card key={label} r={r} label={label} />);
}

// ---------- Page ----------
export default function Today() {
  const t = useToday();
  const [place, setPlaceState] = useState(null);
  const { list } = useSaved();
  useEffect(() => { setPlaceState(getPlace()); }, []);
  const setPlace = (p) => { setPlaceStore(p); setPlaceState(p); };
  if (t == null) return <div className="skeleton" style={{ height: 120 }} />;

  const b = badiDate(t);
  if (!b) return <p className="empty">The calendar covers 2015–2064.</p>;
  const todays = holyDays(b.year).filter((h) => h.date === t);
  const f = fast(b.year);
  const fastNow = f && t >= f.start && t <= f.end ? { day: daysBetween(f.start, t) + 1 } : null;
  const fastNext = (f && t < f.start ? f : fast(b.year + 1)) || null;
  const next = upcoming(addDays(t, 1), 8);
  const feast = next.find((e) => e.kind === "feast");
  const others = next.filter((e) => e !== feast && e.kind !== "fast").slice(0, 5);
  const isFeastDay = b.day === 1 && b.month > 1;

  return (
    <>
      <section className="todayhead">
        <div className="label" style={{ color: "var(--accentText)" }}>Today · {fmtDate(t, { weekday: "long", day: "numeric", month: "long" })}</div>
        <h1>{badiString(b)}</h1>
        <p>{b.month ? <>Month of <strong>{b.monthName}</strong> ({b.meaning})</> : <>Ayyám-i-Há, the Intercalary Days — days of celebration, hospitality and charity before the Fast</>}. Bahá’í days begin at sunset, so Feasts and Holy Days start the evening before.</p>
      </section>

      {todays.map((h) => (
        <section key={h.name} className="tcard2 hot">
          <div className="tlabel">Today is a Holy Day{h.off ? " · work suspended" : ""}</div>
          <h2 className="serif">{h.name}</h2>
          <p className="note">{h.note}</p>
          <a className="act primary" href={devotional(h.theme)} style={{ alignSelf: "flex-start" }}>Devotional for {h.name}</a>
        </section>
      ))}
      {isFeastDay && (
        <section className="tcard2 hot">
          <div className="tlabel">Today · Nineteen Day Feast</div>
          <h2 className="serif">Feast of {b.monthName}</h2>
          <p className="note">The month of {b.meaning}.</p>
          <a className="act primary" href={devotional(b.meaning)} style={{ alignSelf: "flex-start" }}>Devotional on “{b.meaning}”</a>
        </section>
      )}

      <h2 className="sectitle">Readings for today</h2>
      <p className="note" style={{ marginTop: -8 }}>“Recite ye the verses of God every morn and eventide.” <span style={{ whiteSpace: "nowrap" }}>— Bahá’u’lláh, the Kitáb-i-Aqdas</span>. Everyone gets the same two passages today, from the Writings of Bahá’u’lláh and the Báb.</p>
      <Readings t={t} />

      <h2 className="sectitle">Coming up</h2>
      {feast && (
        <section className="tcard2">
          <div className="tlabel">Next Feast · {inDays(daysBetween(t, feast.date))}</div>
          <h2 className="serif">{feast.name} <span className="meaning">· {feast.meaning}</span></h2>
          <p className="note">{fmtDate(feast.date)} — begins at sunset the evening before.</p>
          <div className="actions left">
            <a className="act primary" href={devotional(feast.meaning)}>Devotional on “{feast.meaning}”</a>
          </div>
        </section>
      )}
      <div className="events">
        {others.map((e) => (
          <a key={e.name + e.date} className="event" href={devotional(e.theme || e.meaning)}>
            <span className="edate"><span className="eday">{new Date(e.date).getUTCDate()}</span><span className="emon">{fmtDate(e.date, { month: "short" })}</span></span>
            <span className="etext">
              <span className="ename">{e.name}{e.kind === "feast" ? ` · ${e.meaning}` : ""}</span>
              <span className="enote">{inDays(daysBetween(t, e.date))}{e.kind === "holyday" && e.off ? " · Holy Day, work suspended" : ""}{e.note ? ` · ${e.note}` : ""}</span>
            </span>
          </a>
        ))}
      </div>
      <p className="note" style={{ fontSize: 13 }}>Tap any day for a devotional on its theme. Dates follow the table of the Universal House of Justice.</p>

      <SunCard t={t} place={place} setPlace={setPlace} fastNow={fastNow} fastNext={fastNext} />

      <a className="continue" href="/saved">
        <span className="label">Saved</span>
        <span>{list.length ? `Your saved prayers and passages (${list.length})` : "Tap ♡ Save on any prayer or passage to keep it here"}</span>
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
      </a>
    </>
  );
}
