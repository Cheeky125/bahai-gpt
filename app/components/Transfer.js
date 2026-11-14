"use client";
// Phoenix — move saved items, the prayer streak and settings to another phone or computer.
// Phoenix has no accounts, so everything lives on the device. This makes a one-time 6-character
// code (good for 24 hours, deleted once used); typing it on the other device copies everything over
// and adds it to what is already there — nothing is lost on either side.
import { useState } from "react";
import { track } from "../lib/track";

const KEYS = ["phoenix-saved", "phoenix-op", "phoenix-ruhi-mem", "phoenix-ruhi-last", "phoenix-ruhi-level", "phoenix-devo-counts", "phoenix-place", "phoenix-lang", "phoenix-theme", "phoenix-share-shape"];
const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
const parse = (s) => { try { return JSON.parse(s); } catch (e) { return undefined; } };
const plain = (o) => o && typeof o === "object" && !Array.isArray(o);

export function bundle() {
  const out = {};
  for (const k of KEYS) { const v = get(k); if (v != null) out[k] = v; }
  return { v: 1, made: Date.now(), items: out };
}

// adds what came from the other device to what is here; returns how many saved items were new
export function merge(data) {
  const items = (data && data.items) || {};
  let added = 0;
  for (const [k, v] of Object.entries(items)) {
    if (!KEYS.includes(k) || typeof v !== "string") continue;
    const here = get(k);
    if (k === "phoenix-saved") {
      const mine = parse(here) || [], theirs = parse(v);
      if (!Array.isArray(theirs)) continue;
      const ids = new Set(mine.map((x) => x.id));
      const extra = theirs.filter((x) => x && x.id && !ids.has(x.id));
      added = extra.length;
      set(k, JSON.stringify([...mine, ...extra].sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0))));
    } else if (k === "phoenix-op") {
      const mine = parse(here), theirs = parse(v);
      if (!plain(theirs)) continue;
      if (!plain(mine)) { set(k, v); continue; }
      const days = { ...(theirs.days || {}) };
      for (const [d, x] of Object.entries(mine.days || {})) days[d] = plain(days[d]) && plain(x) ? { ...days[d], ...x } : x;
      set(k, JSON.stringify({ ...theirs, ...mine, days }));
    } else if (here == null) {
      set(k, v);
    } else {
      const mine = parse(here), theirs = parse(v);
      if (plain(mine) && plain(theirs)) set(k, JSON.stringify({ ...theirs, ...mine }));
      // otherwise keep this device's own setting
    }
  }
  try { window.dispatchEvent(new Event("phoenix-saved")); window.dispatchEvent(new Event("phoenix-op")); } catch (e) {}
  return added;
}

export default function Transfer() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [typed, setTyped] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function make() {
    setBusy(true); setMsg(""); setCode("");
    try {
      const r = await fetch("/api/transfer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: bundle() }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.code) throw new Error(j.error || "Couldn’t make a code right now. Please try again.");
      setCode(j.code); track("transfer", "make");
    } catch (e) { setMsg(navigator.onLine === false ? "You’re offline. Connect to the internet to make a code." : e.message); }
    setBusy(false);
  }

  async function take(e) {
    e.preventDefault();
    const c = typed.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (c.length !== 6) { setMsg("Codes have 6 letters and numbers."); return; }
    setBusy(true); setMsg("");
    try {
      const r = await fetch(`/api/transfer?code=${c}`, { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.data) throw new Error(j.error || "That code didn’t work.");
      const n = merge(j.data);
      setTyped(""); track("transfer", "take");
      setMsg(`Done — ${n === 1 ? "1 saved item" : `${n} saved items`} added, and your prayer streak and settings brought over.`);
    } catch (err) { setMsg(navigator.onLine === false ? "You’re offline. Connect to the internet to use a code." : err.message); }
    setBusy(false);
  }

  return (
    <details className="tcard2 transfer" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary><strong>Move to another phone</strong> <span className="note">— your saved items, prayer streak and settings</span></summary>
      <div className="transferbody">
        <div>
          <p className="note">On this device:</p>
          {code
            ? <p className="tcode" aria-live="polite"><span>{code.slice(0, 3)} {code.slice(3)}</span><small>Type this on the other device within 24 hours. It works once.</small></p>
            : <button className="act primary" onClick={make} disabled={busy}>{busy ? "Making a code…" : "Make a transfer code"}</button>}
        </div>
        <form onSubmit={take}>
          <label className="note" htmlFor="tcode-in">On the new device, type the code:</label>
          <div className="tin">
            <input id="tcode-in" value={typed} onChange={(e) => setTyped(e.target.value.toUpperCase())} placeholder="ABC 123" autoComplete="off" autoCapitalize="characters" spellCheck="false" maxLength={8} inputMode="text" />
            <button className="act" type="submit" disabled={busy}>Bring it over</button>
          </div>
        </form>
        {msg && <p className="note" role="status">{msg}</p>}
      </div>
    </details>
  );
}
