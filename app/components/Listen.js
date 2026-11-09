"use client";
// Phoenix — sung versions of prayers (recordings on YouTube, linked by BahaiPrayers.net).
import { useEffect, useState } from "react";

let mapPromise = null;
const loadMap = () => (mapPromise ||= fetch("/api/listen").then((r) => r.json()).then((j) => j.map || {}).catch(() => { mapPromise = null; return {}; }));

// The videos for a prayer card: its own list (other languages) or looked up by Phoenix prayer id
export function useVideos(r) {
  const [vids, setVids] = useState(r.videos || []);
  useEffect(() => {
    if (r.videos || !r.prayer) return;
    let alive = true;
    loadMap().then((m) => { if (alive && m[r.id]) setVids(m[r.id]); });
    return () => { alive = false; };
  }, [r.id, r.prayer, r.videos]);
  return vids;
}

export function ListenToggle({ on, onClick }) {
  return (
    <button className={`act${on ? " on" : ""}`} onClick={onClick} aria-expanded={on} data-track={on ? undefined : "sung_play"}>
      <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" /></svg>
      {on ? "Hide song" : "Sung"}
    </button>
  );
}

export function Player({ vids }) {
  const [i, setI] = useState(0);
  return (
    <div className="ytbox">
      <div className="ytwrap">
        <iframe src={`https://www.youtube-nocookie.com/embed/${vids[i]}?autoplay=1&rel=0&modestbranding=1`} title="A sung version of this prayer"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
      </div>
      <div className="ytfoot">
        {vids.length > 1 && <button className="act" data-track="sung_play|another version" onClick={() => setI((i + 1) % vids.length)}>Another version ({i + 1} of {vids.length})</button>}
        <span className="note">Sung by Bahá’ís around the world · links from <a href="https://bahaiprayers.net" target="_blank" rel="noopener noreferrer">BahaiPrayers.net</a></span>
      </div>
    </div>
  );
}
