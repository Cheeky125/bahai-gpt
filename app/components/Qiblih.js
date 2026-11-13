"use client";
// Phoenix — the Qiblih (Bahjí): its direction from where you are, and a full-screen live compass
// (Draft B: a ring of embers burning brightest toward the Qiblih, the phoenix in the middle).
import { useEffect, useRef, useState } from "react";
import { Place, getPlace, setPlaceStore } from "./Place";
import { track } from "../lib/track";

// 36 embers round the ring; the one at the top (toward the Qiblih) is biggest and brightest
const EMBERS = Array.from({ length: 36 }, (_, i) => {
  const a = i * 10, d = Math.min(a, 360 - a);
  const x = 150 + 132 * Math.sin((a * Math.PI) / 180), y = 150 - 132 * Math.cos((a * Math.PI) / 180);
  return [+x.toFixed(1), +y.toFixed(1), d < 6 ? 9 : d < 30 ? 6 : 3.5, +Math.max(0.14, 1 - d / 70).toFixed(2)];
});

// The Phoenix mark, with its wings as their own group so they can beat
export function Bird({ id }) {
  return (
    <svg x="0" y="0" width="100" height="100" viewBox="0 0 100 100" overflow="visible">
      <defs>
        <linearGradient id={`${id}w`} x1="0.5" y1="1" x2="0.5" y2="0"><stop offset="0" stopColor="#FFC93C" /><stop offset="0.45" stopColor="#F3701E" /><stop offset="1" stopColor="#B5170F" /></linearGradient>
        <linearGradient id={`${id}i`} x1="0.5" y1="1" x2="0.5" y2="0"><stop offset="0" stopColor="#FFE08A" /><stop offset="1" stopColor="#F79A1E" /></linearGradient>
        <linearGradient id={`${id}b`} x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0" stopColor="#FFF1C2" /><stop offset="0.6" stopColor="#FFB627" /><stop offset="1" stopColor="#E4531A" /></linearGradient>
      </defs>
      <g className="fwings">
        <path d="M50 58C38 54 22 46 8 22C16 28 22 30 26 30C20 24 18 16 20 8C26 20 34 26 40 30C38 22 40 14 44 8C46 22 48 34 50 44Z" fill={`url(#${id}w)`} />
        <path d="M50 58C62 54 78 46 92 22C84 28 78 30 74 30C80 24 82 16 80 8C74 20 66 26 60 30C62 22 60 14 56 8C54 22 52 34 50 44Z" fill={`url(#${id}w)`} />
        <path d="M50 58C40 54 28 46 20 32C28 38 34 40 38 40C34 34 34 28 36 22C40 32 46 38 50 46Z" fill={`url(#${id}i)`} />
        <path d="M50 58C60 54 72 46 80 32C72 38 66 40 62 40C66 34 66 28 64 22C60 32 54 38 50 46Z" fill={`url(#${id}i)`} />
      </g>
      <path d="M50 72C44 80 40 86 34 96C42 90 46 88 50 84C54 88 58 90 66 96C60 86 56 80 50 72Z" fill={`url(#${id}w)`} />
      <path d="M50 76C48 84 49 90 50 98C51 90 52 84 50 76Z" fill="#FFC93C" />
      <path d="M50 30C56 38 57 50 54 62C53 68 51 72 50 76C49 72 47 68 46 62C43 50 44 38 50 30Z" fill={`url(#${id}b)`} />
      <path d="M50 22C48 16 50 10 54 6C53 12 54 16 52 22Z" fill="#F3701E" />
      <path d="M50 22C53 22 55 25 54 28C53 30 51 31 50 31C49 31 47 30 46 28C45 25 47 22 50 22Z" fill="#F79A1E" />
    </svg>
  );
}

const BAHJI = { lat: 32.9434, lon: 35.092 }; // the Shrine of Bahá’u’lláh, Bahjí, near ‘Akká
const R = (d) => (d * Math.PI) / 180;
export function bearingTo(lat, lon) {
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
export const pointName = (b) => POINTS[Math.round(b / 45) % 8];

// Start the phone's compass. iPhones only allow this straight from a tap, so it runs inside the tap itself.
export function askCompass() {
  try {
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function")
      return DeviceOrientationEvent.requestPermission().catch(() => "denied");
  } catch (e) { return Promise.resolve("denied"); }
  return Promise.resolve("granted");
}

// The small dial on the page; tapping it opens the live compass
export function QiblihCard({ place, onOpen }) {
  const bearing = place ? bearingTo(place.lat, place.lon) : null;
  return (
    <button className="qcard" onClick={onOpen} aria-label="Open the Qiblih compass">
      <svg viewBox="0 0 300 300" width="96" height="96" aria-hidden="true">
        <g transform={`rotate(${bearing ?? 45} 150 150)`}>
          {EMBERS.map(([x, y, r, o], i) => <circle key={i} cx={x} cy={y} r={r * 1.3} className="fember" style={{ opacity: o }} />)}
        </g>
        <g transform="translate(95 95) scale(1.1)"><Bird id="qc" /></g>
      </svg>
      <span className="qcardtext">
        <strong>Find the Qiblih</strong>
        <span className="note" style={{ fontSize: 14 }}>{bearing != null ? `${Math.round(bearing)}° from north — ${pointName(bearing)}. ` : ""}Tap to open the compass, then turn until the brightest ember is straight ahead.</span>
      </span>
    </button>
  );
}

// Full-screen live compass: the arrow always points to the Qiblih; turn until it points straight ahead
export function Finder({ place, setPlace, perm, onClose }) {
  const [heading, setHeading] = useState(null);
  const [status, setStatus] = useState("starting"); // starting | on | nocompass | denied
  const [loc, setLoc] = useState(place ? "ok" : "locating"); // ok | locating | failed
  const angle = useRef(null), wasFacing = useRef(false), counted = useRef(false);
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
  useEffect(() => {
    if (facing && !wasFacing.current) { try { navigator.vibrate?.(80); } catch (e) {} if (!counted.current) { counted.current = true; track("compass_facing"); } }
    wasFacing.current = facing;
  }, [facing]);

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
          <defs>
            <radialGradient id="fhalo"><stop offset="0" stopColor="#F3701E" stopOpacity=".55" /><stop offset="1" stopColor="#F3701E" stopOpacity="0" /></radialGradient>
          </defs>
          {/* north, turning with the world */}
          <g style={{ transform: `rotate(${live ? -heading : 0}deg)`, transformOrigin: "150px 150px" }}>
            <text x="150" y="44" className="fnorth">N</text>
          </g>
          {/* the ring of embers: brightest toward the Qiblih */}
          {place && (
            <g style={{ transform: `rotate(${angle.current}deg)`, transformOrigin: "150px 150px", transition: "transform .3s ease-out" }}>
              {EMBERS.map(([x, y, r, o], i) => <circle key={i} cx={x} cy={y} r={r} className="fember" style={{ opacity: o }} />)}
              <circle cx="150" cy="18" r="26" fill="url(#fhalo)" className="fglow" />
            </g>
          )}
          {/* where the phone points */}
          <path d="M150 -4 L159 10 L141 10 Z" className="fme" />
          {facing && <><circle cx="150" cy="150" r="30" className="fpulse" /><circle cx="150" cy="150" r="30" className="fpulse" style={{ animationDelay: ".8s" }} /></>}
          <g className="fbird">
            <circle cx="150" cy="150" r="64" fill="url(#fhalo)" className="fglow" />
            <g transform="translate(103 103) scale(.94)"><Bird id="fb" /></g>
          </g>
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


// Home page: a one-tap button that opens the compass
// Home page tile: opens the compass straight away, like the launcher below.
export function QiblihTile() {
  const [place, setPlaceState] = useState(null);
  const [finder, setFinder] = useState(null);
  useEffect(() => { setPlaceState(getPlace()); }, []);
  const setPlace = (p) => { setPlaceStore(p); setPlaceState(p); };
  const b = place ? bearingTo(place.lat, place.lon) : null;
  return (
    <>
      <button className="tile" data-track="compass_open|home" onClick={() => setFinder(askCompass())}>
        <span className="fic"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></svg></span>
        <span className="t1">Qiblih</span>
        <span className="t2">{b != null ? `${Math.round(b)}° ${pointName(b)}` : "Open the compass"}</span>
      </button>
      {finder && <Finder place={place} setPlace={setPlace} perm={finder} onClose={() => setFinder(null)} />}
    </>
  );
}

export function QiblihLauncher() {
  const [place, setPlaceState] = useState(null);
  const [finder, setFinder] = useState(null);
  useEffect(() => { setPlaceState(getPlace()); }, []);
  const setPlace = (p) => { setPlaceStore(p); setPlaceState(p); };
  const b = place ? bearingTo(place.lat, place.lon) : null;
  return (
    <>
      <button className="todaystrip qlaunch" data-track="compass_open|home" onClick={() => setFinder(askCompass())}>
        <span className="fic"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></svg></span>
        <span className="ftext">
          <span className="ftitle">Find the Qiblih</span>
          <span className="fdesc">{b != null ? `${Math.round(b)}° from north, ${pointName(b)} · ` : ""}Tap for the compass</span>
        </span>
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
      </button>
      {finder && <Finder place={place} setPlace={setPlace} perm={finder} onClose={() => setFinder(null)} />}
    </>
  );
}
