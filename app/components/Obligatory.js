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

function Compass({ place }) {
  const [heading, setHeading] = useState(null);
  const [state, setState] = useState("idle"); // idle | on | none | denied
  const got = useRef(false), wasFacing = useRef(false);
  const bearing = place ? bearingTo(place.lat, place.lon) : null;
  const h = useRef(null);
  if (!h.current) h.current = {
    abs: (e) => { if (e.alpha != null) { got.current = true; setHeading((360 - e.alpha + (screen.orientation?.angle || 0)) % 360); } },
    ios: (e) => { if (e.webkitCompassHeading != null) { got.current = true; setHeading(e.webkitCompassHeading); } },
  };
  const onAbs = h.current.abs, onIOS = h.current.ios;
  useEffect(() => () => { window.removeEventListener("deviceorientationabsolute", onAbs); window.removeEventListener("deviceorientation", onIOS); }, [onAbs, onIOS]);
  const start = async () => {
    try {
      if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
        if ((await DeviceOrientationEvent.requestPermission()) !== "granted") { setState("denied"); return; }
      }
    } catch (e) { setState("denied"); return; }
    if ("ondeviceorientationabsolute" in window) window.addEventListener("deviceorientationabsolute", onAbs);
    else window.addEventListener("deviceorientation", onIOS);
    setState("on");
    setTimeout(() => { if (!got.current) setState("none"); }, 2500);
  };
  const rose = heading == null ? 0 : -heading;
  const diff = heading == null || bearing == null ? null : ((bearing - heading + 540) % 360) - 180;
  const facing = diff != null && Math.abs(diff) < 5;
  useEffect(() => { if (facing && !wasFacing.current && navigator.vibrate) navigator.vibrate(60); wasFacing.current = facing; }, [facing]);
  if (!place) return <p className="note" style={{ fontSize: 15 }}>Add your location below to see which way the Qiblih is.</p>;
  return (
    <div className="qiblih">
      <svg viewBox="0 0 240 240" width="240" height="240" role="img" aria-label={`The Qiblih is ${Math.round(bearing)} degrees from north, to the ${pointName(bearing)}`}>
        <circle cx="120" cy="120" r="112" className={`qdial${facing ? " on" : ""}`} />
        <g style={{ transform: `rotate(${rose}deg)`, transformOrigin: "120px 120px", transition: "transform .2s linear" }}>
          {[...Array(72)].map((_, i) => <line key={i} x1="120" y1="12" x2="120" y2={i % 18 === 0 ? 26 : i % 2 ? 18 : 21} className="qtick" transform={`rotate(${i * 5} 120 120)`} />)}
          {[["N", 0], ["E", 90], ["S", 180], ["W", 270]].map(([l, a]) => (
            <text key={l} x={120 + 78 * Math.sin(R(a))} y={120 - 78 * Math.cos(R(a))} dy="6" className={`qletter${l === "N" ? " n" : ""}`} style={{ transform: `rotate(${-rose}deg)`, transformBox: "fill-box", transformOrigin: "center" }}>{l}</text>
          ))}
          <g transform={`rotate(${bearing} 120 120)`}>
            <path d="M120 54 L131 92 L120 84 L109 92 Z" className="qarrow" />
            <line x1="120" y1="88" x2="120" y2="120" className="qstem" />
          </g>
        </g>
        {heading != null && <path d="M120 2 L127 14 L113 14 Z" className="qme" />}
        <circle cx="120" cy="120" r="5" className="qhub" />
      </svg>
      <div className="qtext">
        {heading != null
          ? <strong>{facing ? "You’re facing the Qiblih" : `Turn ${diff > 0 ? "right" : "left"} ${Math.round(Math.abs(diff))}°`}</strong>
          : <strong>{Math.round(bearing)}° from north — {pointName(bearing)}</strong>}
        <span className="note" style={{ fontSize: 14 }}>Toward Bahjí, near ‘Akká · {Math.round(distanceKm(place.lat, place.lon)).toLocaleString()} km from {place.name === "Your location" ? "you" : place.name.split(",")[0]}</span>
        {state === "idle" && <button className="act primary" onClick={start} style={{ alignSelf: "center" }}>Use my phone’s compass</button>}
        {state === "on" && heading == null && <span className="note" style={{ fontSize: 14 }}>Hold your phone flat…</span>}
        {state === "on" && heading != null && <span className="note" style={{ fontSize: 13 }}>Hold your phone flat, away from metal. If it seems off, move it in a figure 8.</span>}
        {state === "none" && <span className="note" style={{ fontSize: 14 }}>This device has no compass — use the direction above with any compass.</span>}
        {state === "denied" && <span className="note" style={{ fontSize: 14 }}>Compass access was turned off. You can still use the direction above.</span>}
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
        <Compass place={place} />
      </section>

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
