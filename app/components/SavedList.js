"use client";
import { useState } from "react";
import { Card } from "./Phoenix";
import { useSaved } from "./Saved";

const FILTERS = [["all", "All"], ["prayers", "Prayers"], ["writings", "Passages"], ["stories", "Stories"]];
const kindOf = (r) => (r.prayer ? "prayers" : r.story ? "stories" : "writings");

export default function SavedList() {
  const { list } = useSaved();
  const [f, setF] = useState("all");
  const shown = list.filter((r) => f === "all" || kindOf(r) === f);
  return (
    <>
      <h1>Saved</h1>
      <p>The prayers, passages and stories you’ve saved, kept on this device. Tap ♡ on any of them to remove it.</p>
      {list.length > 0 && (
        <div className="chips left" role="group" aria-label="Show">
          {FILTERS.map(([k, t]) => {
            const n = k === "all" ? list.length : list.filter((r) => kindOf(r) === k).length;
            return n || k === "all" ? <button key={k} className="chip" aria-pressed={f === k} onClick={() => setF(k)}>{t} ({n})</button> : null;
          })}
        </div>
      )}
      {list.length === 0 && (
        <div className="tcard2">
          <p className="note">Nothing saved yet. Tap <strong>♡ Save</strong> on any prayer, passage or story and it will be here, ready to read.</p>
          <div className="actions left"><a className="act primary" href="/prayers">Browse prayers</a><a className="act" href="/today">Today’s reading</a></div>
        </div>
      )}
      {shown.map((r) => <Card key={r.id} r={r} />)}
    </>
  );
}
