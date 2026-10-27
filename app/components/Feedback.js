"use client";
import { useState } from "react";

// "Send feedback" — a small form that sends a note (with the page and search it came from) to Phoenix's
// feedback table. Contact details are optional.
export default function Feedback({ query, label = "Send feedback" }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [contact, setContact] = useState("");
  const [st, setSt] = useState({ status: "idle" });
  const send = async (e) => {
    e.preventDefault();
    setSt({ status: "sending" });
    try {
      const r = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msg, contact, query: query || "", page: window.location.pathname + window.location.search }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Couldn’t send");
      setSt({ status: "sent" }); setMsg(""); setContact("");
    } catch (err) { setSt({ status: "error", error: err.message }); }
  };
  if (!open) return <button className="fbbtn" onClick={() => { setOpen(true); setSt({ status: "idle" }); }}>{label}</button>;
  return (
    <form className="fbform" onSubmit={send}>
      {st.status === "sent" ? (
        <>
          <p className="note" style={{ margin: 0 }}>Thank you! Your feedback was sent.</p>
          <button type="button" className="act" onClick={() => setOpen(false)} style={{ alignSelf: "flex-start" }}>Close</button>
        </>
      ) : (
        <>
          <label htmlFor="fbmsg" className="steplabel">What could be better?</label>
          <textarea id="fbmsg" value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} maxLength={3000} placeholder="e.g. I searched for … and expected …, or a quote that’s missing" required />
          <label htmlFor="fbcontact" className="cit">Your name or email, if you’d like a reply (optional)</label>
          <input id="fbcontact" value={contact} onChange={(e) => setContact(e.target.value)} maxLength={200} autoComplete="email" />
          {st.status === "error" && <p className="empty" style={{ padding: 0, margin: 0 }}>{st.error}</p>}
          <div className="dbar">
            <button type="submit" className="act primary" disabled={st.status === "sending" || msg.trim().length < 2}>{st.status === "sending" ? "Sending…" : "Send"}</button>
            <button type="button" className="act" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </>
      )}
    </form>
  );
}
