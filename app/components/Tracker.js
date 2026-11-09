"use client";
// Counts clicks on anything marked data-track="name" or data-track="name|detail", plus feature cards,
// the phone tab bar and links out of the site.
import { useEffect } from "react";
import { track } from "../lib/track";

export default function Tracker() {
  useEffect(() => {
    const onClick = (e) => {
      const el = e.target.closest?.("[data-track], a.feature, .bottomnav a, a[target='_blank']");
      if (!el) return;
      const t = el.getAttribute("data-track");
      if (t) { const [name, ...rest] = t.split("|"); track(name, rest.join("|") || null); return; }
      if (el.matches("a.feature")) return track("feature_card", el.querySelector(".ftitle")?.textContent);
      if (el.closest(".bottomnav")) return track("tab_bar", el.textContent.trim());
      try { track("link_out", new URL(el.href).hostname.replace(/^www\./, "")); } catch (err) {}
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
