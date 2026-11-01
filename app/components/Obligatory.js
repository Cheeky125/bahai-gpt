"use client";
// Phoenix — the obligatory prayer: the three prayers word for word, today's times where you are,
// a compass to the Qiblih (Bahjí), and a private streak kept only on this device.
import { useEffect, useRef, useState } from "react";
import OB from "../lib/obligatory.json";
import { Place, getPlace, setPlaceStore } from "./Place";
import { QiblihCard, Finder, askCompass } from "./Qiblih";
import { sunTimes, todayIn, fmtTime } from "../lib/sun";

import { load, save, done, keyOf, shift, streaks } from "../lib/opstreak";

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
