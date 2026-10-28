"use client";
// Phoenix — favourites. A heart on any prayer, passage or story keeps a copy on this device (no account needed).
import { useEffect, useState } from "react";

const KEY = "phoenix-saved";
const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; } };
const write = (list) => {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
  window.dispatchEvent(new Event("phoenix-saved"));
};
const FIELDS = ["id", "text", "excerpt", "author", "book", "section", "para", "citation", "onBehalf", "url", "prayer", "story", "theme", "kind"];

export function useSaved() {
  const [list, setList] = useState([]);
  useEffect(() => {
    const upd = () => setList(read());
    upd();
    window.addEventListener("phoenix-saved", upd);
    window.addEventListener("storage", upd);
    return () => { window.removeEventListener("phoenix-saved", upd); window.removeEventListener("storage", upd); };
  }, []);
  const has = (id) => list.some((x) => x.id === id);
  const toggle = (r) => {
    const cur = read();
    if (cur.some((x) => x.id === r.id)) write(cur.filter((x) => x.id !== r.id));
    else write([{ ...Object.fromEntries(FIELDS.filter((k) => r[k] != null).map((k) => [k, r[k]])), savedAt: Date.now() }, ...cur]);
  };
  return { list, has, toggle };
}

export function FavButton({ r }) {
  const { has, toggle } = useSaved();
  const on = has(r.id);
  return (
    <button className={`act fav${on ? " on" : ""}`} aria-pressed={on} onClick={() => toggle(r)} aria-label={on ? "Remove from saved" : "Save"}>
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.8 3.6 4.5 7 4.5c2 0 3.5 1.1 5 3 1.5-1.9 3-3 5-3 3.4 0 5.6 3.3 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2Z" /></svg>
      {on ? "Saved" : "Save"}
    </button>
  );
}

export function SavedLink() {
  const { list } = useSaved();
  return (
    <a className="iconbtn savedlink" href="/saved" aria-label={`Saved (${list.length})`} title="Saved">
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.8 3.6 4.5 7 4.5c2 0 3.5 1.1 5 3 1.5-1.9 3-3 5-3 3.4 0 5.6 3.3 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2Z" /></svg>
      {list.length > 0 && <span className="savedcount">{list.length}</span>}
    </a>
  );
}
