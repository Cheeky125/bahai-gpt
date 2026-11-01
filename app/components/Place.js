"use client";
// Phoenix — where you are (for sunrise/sunset, prayer times and the Qiblih). Saved only in this browser.
import { useState } from "react";

export const PLACE_KEY = "phoenix-place";
export const getPlace = () => { try { return JSON.parse(localStorage.getItem(PLACE_KEY) || "null"); } catch (e) { return null; } };
export const setPlaceStore = (p) => { try { p ? localStorage.setItem(PLACE_KEY, JSON.stringify(p)) : localStorage.removeItem(PLACE_KEY); } catch (e) {} };

export function Place({ place, setPlace }) {
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

