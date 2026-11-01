"use client";
// Phoenix — the obligatory prayer: the three prayers word for word, today's times where you are,
// a compass to the Qiblih (Bahjí), and a private streak kept only on this device.
import { useEffect, useRef, useState } from "react";
import OB from "../lib/obligatory.json";
import { Place, getPlace, setPlaceStore } from "./Today";
import { sunTimes, todayIn, fmtTime } from "../lib/sun";

import { load, save, done, keyOf, shift, streaks } from "../lib/opstreak";

// ---------- Qiblih ----------
const BAHJI = { lat: 32.9434, lon: 35.092 }; // the Shrine of Bahá’u’lláh, Bahjí, near ‘Akká
const R = (d) => (d * Math.PI) / 180;
function bearingTo(lat, lon) {
  const φ1 = R(lat), φ2 = R(BAHJI.lat), Δλ = R(BAHJI.lon - lon);
  const y = Math.sin(Δλ) * Math.cos(φ2), x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
function distanceKm(lat, lon) {
  const φ1 = R(lat), φ2 = R(BAHJI.lat), dφ = φ2 - φ1, dλ = R(BAHJI.lon - lon);
  const a = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
const POINTS = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];
const pointName = (b) => POINTS[Math.round(b / 45) % 8];

// Start the phone's compass. iPhones only allow this straight from a tap, so it runs inside the tap itself.
function askCompass() {
  try {
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function")
      return DeviceOrientationEvent.requestPermission().catch(() => "denied");
  } catch (e) { return Promise.resolve("denied"); }
  return Promise.resolve("granted");
}

// The small dial on the page; tapping it opens the live compass
function QiblihCard({ place, onOpen }) {
  const bearing = place ? bearingTo(place.lat, place.lon) : null;
  return (
    <button className="qcard" onClick={onOpen} aria-label="Open the Qiblih compass">
      <svg viewBox="0 0 120 120" width="96" height="96" aria-hidden="true">
        <circle cx="60" cy="60" r="56" className="qdial" />
        <text x="60" y="22" className="qletter n">N</text>
        <g transform={`rotate(${bearing ?? 45} 60 60)`}><path d="M60 20 L70 52 L60 45 L50 52 Z" className="qarrow" /><line x1="60" y1="48" x2="60" y2="80" className="qstem" /></g>
        <circle cx="60" cy="60" r="4" className="qhub" />
      </svg>
      <span className="qcardtext">
        <strong>Find the Qiblih</strong>
        <span className="note" style={{ fontSize: 14 }}>{bearing != null ? `${Math.round(bearing)}° from north — ${pointName(bearing)}. ` : ""}Tap to open the compass, then turn until the arrow points straight up.</span>
      </span>
    </button>
  );
}

// Full-screen live compass: the arrow always points to the Qiblih; turn until it points straight ahead
function Finder({ place, setPlace, perm, onClose }) {
  const [heading, setHeading] = useState(null);
  const [status, setStatus] = useState("starting"); // starting | on | nocompass | denied
  const [loc, setLoc] = useState(place ? "ok" : "locating"); // ok | locating | failed
  const angle = useRef(null), wasFacing = useRef(false);
  // the phone's location, if we don't have one yet
  useEffect(() => {
    if (place) { setLoc("ok"); return; }
    if (!navigator.geolocation) { setLoc("failed"); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => { setPlace({ name: "Your location", lat: +p.coords.latitude.toFixed(2), lon: +p.coords.longitude.toFixed(2), tz: Intl.DateTimeFormat().resolvedOptions().timeZone }); setLoc("ok"); },
      () => setLoc("failed"), { timeout: 15000, maximumAge: 86400000 });
  }, [place]); // eslint-disable-line react-hooks/exhaustive-deps
  // the compass
  useEffect(() => {
    let got = false, lock = null;
    const abs = (e) => { if (e.alpha != null) { got = true; setHeading((360 - e.alpha + (screen.orientation?.angle || 0)) % 360); } };
    const ios = (e) => { if (e.webkitCompassHeading != null) { got = true; setHeading(e.webkitCompassHeading); } };
    let timer;
    perm.then((r) => {
      if (r !== "granted") { setStatus("denied"); return; }
      if ("ondeviceorientationabsolute" in window) window.addEventListener("deviceorientationabsolute", abs);
      else window.addEventListener("deviceorientation", ios);
      setStatus("on");
      timer = setTimeout(() => { if (!got) setStatus("nocompass"); }, 3000);
    });
    try { navigator.wakeLock?.request("screen").then((l) => { lock = l; }).catch(() => {}); } catch (e) {}
    const esc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(timer);
      window.removeEventListener("deviceorientationabsolute", abs); window.removeEventListener("deviceorientation", ios);
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
      try { lock?.release(); } catch (e) {}
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const bearing = place ? bearingTo(place.lat, place.lon) : null;
  const live = heading != null && bearing != null;
  const target = bearing == null ? 0 : live ? bearing - heading : bearing;
  // turn the shortest way (no spinning round when passing north)
  if (angle.current == null) angle.current = target;
  else angle.current += ((((target - angle.current) % 360) + 540) % 360) - 180;
  const diff = live ? ((((bearing - heading) % 360) + 540) % 360) - 180 : null;
  const facing = diff != null && Math.abs(diff) < 6;
  useEffect(() => { if (facing && !wasFacing.current) { try { navigator.vibrate?.(80); } catch (e) {} } wasFacing.current = facing; }, [facing]);

  return (
    <div className={`finder${facing ? " facing" : ""}`} role="dialog" aria-modal="true" aria-label="Qiblih compass">
      <button className="iconbtn finderclose" onClick={onClose} aria-label="Close">✕</button>
      <div className="finderhead">
        <div className="label">The Qiblih · Bahjí</div>
        <div className="findermsg" aria-live="polite">
          {!place ? (loc === "locating" ? "Finding where you are…" : "Add your location")
            : facing ? "You’re facing the Qiblih"
            : live ? `Turn ${diff > 0 ? "right" : "left"}`
            : status === "starting" || status === "on" ? "Hold your phone flat…"
            : `Face ${Math.round(bearing)}° — ${pointName(bearing)}`}
        </div>
      </div>
      <div className="finderdial">
        <svg viewBox="0 0 300 300" aria-hidden="true">
          <circle cx="150" cy="150" r="140" className="fring" />
          {/* north marker turns with the world */}
          {live && <g style={{ transform: `rotate(${-heading}deg)`, transformOrigin: "150px 150px" }}><text x="150" y="34" className="fnorth">N</text></g>}
          {!live && <text x="150" y="34" className="fnorth">N</text>}
          {/* phone's forward direction */}
          <path d="M150 2 L160 18 L140 18 Z" className="fme" />
          {place && (
            <g style={{ transform: `rotate(${angle.current}deg)`, transformOrigin: "150px 150px", transition: "transform .25s ease-out" }}>
              <path d="M150 44 L186 132 L156 118 L156 228 L144 228 L144 118 L114 132 Z" className="farrow" />
            </g>
          )}
          <circle cx="150" cy="150" r="8" className="fhub" />
        </svg>
      </div>
      <div className="finderfoot">
        {place && <p>{live ? (facing ? "Hold still and begin your prayer." : `${Math.round(Math.abs(diff))}° to go`) : `Toward Bahjí, near ‘Akká · ${Math.round(distanceKm(place.lat, place.lon)).toLocaleString()} km`}</p>}
        {status === "nocompass" && place && <p className="small">This device has no compass. Face {Math.round(bearing)}° from north ({pointName(bearing)}) using any compass.</p>}
        {status === "denied" && place && <p className="small">Compass access is off. Allow motion &amp; orientation for this site in your browser settings, or face {Math.round(bearing)}° from north.</p>}
        {live && !facing && <p className="small">Hold your phone flat, away from metal. If it seems off, move it in a figure 8.</p>}
        {!place && loc === "failed" && <div style={{ width: "100%", maxWidth: 360, textAlign: "left" }}><p className="small">Couldn’t get your location — type your city:</p><Place place={place} setPlace={setPlace} /></div>}
      </div>
    </div>
  );
}

// ---------- times ----------
function Times({ place, choice }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(id); }, []);
  const [y, m, d] = todayIn(place.tz);
  const s = sunTimes(y, m, d, place.lat, place.lon);
  if (s.sunrise == null) return <p className="note">The sun doesn’t rise or set here today, so the times can’t be worked out automatically.</p>;
  const t = (x) => fmtTime(x, place.tz);
  const evEnd = s.sunset + 2 * 3600000;
  const slots = choice === "medium"
    ? [["Morning", s.sunrise, s.noon], ["Noon", s.noon, s.sunset], ["Evening", s.sunset, evEnd]]
    : choice === "short" ? [["Noon", s.noon, s.sunset]] : [];
  return (
    <div className="slots">
      {choice === "long" && <p className="note" style={{ fontSize: 15 }}>The Long Obligatory Prayer is said once in twenty-four hours, at any time.</p>}
      {slots.map(([name, a, b]) => {
        const on = now >= a && now < b, past = now >= b;
        return (
          <div key={name} className={`slot${on ? " on" : ""}${past ? " past" : ""}`}>
            <span className="sname">{name}</span>
            <span className="stime">{t(a)} – {t(b)}</span>
            <span className="snote">{on ? `now · until ${t(b)}` : past ? "passed" : `opens ${t(a)}`}</span>
          </div>
        );
      })}
      <p className="note" style={{ fontSize: 13 }}>{place.name} · noon is when the sun is highest ({t(s.noon)}). “{OB.notes[1].replace(/^“|”$/g, "")}”</p>
    </div>
  );
}

// ---------- page ----------
export default function Obligatory() {
  const [st, setSt] = useState(null);
  const [place, setPlaceState] = useState(null);
  const [today, setToday] = useState(null);
  const [showAbl, setShowAbl] = useState(false);
  const [finder, setFinder] = useState(null); // the compass permission request while the compass is open
  useEffect(() => {
    setSt(load()); setPlaceState(getPlace());
    const upd = () => { const [y, m, d] = todayIn(); setToday(keyOf(y, m, d)); };
    upd(); const id = setInterval(upd, 60000); return () => clearInterval(id);
  }, []);
  if (!st || !today) return <div className="skeleton" style={{ height: 200 }} />;
  const setPlace = (p) => { setPlaceStore(p); setPlaceState(p); };
  const update = (fn) => { const n = { ...st, days: { ...st.days } }; fn(n); save(n); setSt(n); };
  const choice = st.choice || "short";
  const day = st.days[today] || {};
  const mark = (k) => update((n) => { const cur = { ...(n.days[today] || {}) }; if (cur[k]) delete cur[k]; else cur[k] = Date.now(); if (Object.keys(cur).length) n.days[today] = cur; else delete n.days[today]; });
  const { cur, best } = streaks(st.days, today);
  const last28 = [...Array(28)].map((_, i) => shift(today, i - 27));
  const P = OB.prayers[choice];
  const isDone = done(day);

  return (
    <>
      <h1>Obligatory Prayer</h1>
      <p className="note">{OB.notes[0]} <a href={OB.source} target="_blank" rel="noopener noreferrer">Bahá’í Prayers</a></p>

      <div className="tabs" role="tablist" aria-label="Which prayer">
        {Object.entries(OB.prayers).map(([k, p]) => (
          <button key={k} className="tab" role="tab" aria-selected={choice === k} onClick={() => update((n) => { n.choice = k; })}>{p.name}</button>
        ))}
      </div>
      <p className="note" style={{ marginTop: -6, fontSize: 14 }}>{P.when}.</p>

      {/* streak */}
      <section className={`tcard2${isDone ? " hot" : ""}`}>
        <div className="streakrow">
          <div className="streaknum"><span className="big">{cur}</span><span>day{cur === 1 ? "" : "s"} in a row</span></div>
          {best > 0 && <div className="note" style={{ fontSize: 14 }}>Best: {best}</div>}
        </div>
        {choice === "medium" ? (
          <div className="actions left">
            {[["m", "Morning"], ["n", "Noon"], ["e", "Evening"]].map(([k, l]) => (
              <button key={k} className={`act${day[k] ? " on" : ""}`} aria-pressed={!!day[k]} onClick={() => mark(k)}>{day[k] ? "✓ " : ""}{l}</button>
            ))}
          </div>
        ) : (
          <button className={`act${day[choice] ? " on" : " primary"}`} aria-pressed={!!day[choice]} onClick={() => mark(choice)} style={{ alignSelf: "flex-start" }}>
            {day[choice] ? "✓ Said today" : "I’ve said today’s prayer"}
          </button>
        )}
        <div className="dots" aria-label="The last four weeks">
          {last28.map((k) => <span key={k} className={`dot${done(st.days[k]) ? " on" : ""}${k === today ? " today" : ""}`} title={k} />)}
        </div>
        <p className="note" style={{ fontSize: 13 }}>Only you can see this — it’s kept on this device, nowhere else. A day counts when you mark {choice === "medium" ? "all three times" : "the prayer"} as said.</p>
      </section>

      {/* times */}
      <section className="tcard2">
        <div className="tlabel">Today’s times</div>
        {place ? <Times place={place} choice={choice} /> : <p className="note" style={{ fontSize: 15 }}>Add your location to see the times for {P.name.toLowerCase()} prayer and the direction of the Qiblih. It’s saved only on this device.</p>}
        <Place place={place} setPlace={setPlace} />
      </section>

      {/* qiblih */}
      <section className="tcard2">
        <div className="tlabel">The Qiblih</div>
        <QiblihCard place={place} onOpen={() => setFinder(askCompass())} />
      </section>

      {finder && <Finder place={place} setPlace={setPlace} perm={finder} onClose={() => setFinder(null)} />}

      {/* prayer */}
      <section className="card oprayer">
        <div className="label cardlabel">The {P.name} Obligatory Prayer</div>
        {P.heading && <p className="rubric heading">{P.heading}</p>}
        <button className="act link" onClick={() => setShowAbl(!showAbl)} aria-expanded={showAbl} style={{ alignSelf: "flex-start" }}>{showAbl ? "Hide" : "Before you pray: ablutions"}</button>
        {showAbl && (
          <div className="fullpassage">
            <ul className="abl">{OB.ablutions.items.map((x) => <li key={x}>{x}</li>)}</ul>
            <p style={{ fontSize: 15 }}>The verse to repeat five times when there is no water: “In the Name of God, the Most Pure, the Most Pure.” <span className="note">— The Kitáb-i-Aqdas ¶10</span></p>
            {choice === "short" && <p style={{ fontSize: 15 }}>“{OB.ablutions.standing}”</p>}
            <a className="note" style={{ fontSize: 13 }} href={OB.ablutions.url} target="_blank" rel="noopener noreferrer">From the Synopsis and Codification of the Kitáb-i-Aqdas</a>
          </div>
        )}
        {P.blocks.map((b, i) => b.r ? <p key={i} className="rubric">{b.r}</p> : <p key={i} className="quote">{b.p}</p>)}
        <div className="meta"><div><div className="who">Bahá’u’lláh</div><div className="src">Bahá’í Prayers</div></div>
          <a className="act link" href={OB.source} target="_blank" rel="noopener noreferrer">bahai.org</a></div>
      </section>
    </>
  );
}
