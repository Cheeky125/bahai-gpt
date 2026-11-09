// Phoenix — anonymous click counting (see db/4_events.sql). No personal data: an event name, a short
// detail, the page, and a random id kept in this browser so visitors can be counted.
let vid = null;
function visitor() {
  if (vid) return vid;
  try { vid = localStorage.getItem("phoenix-vid"); if (!vid) { vid = Math.random().toString(36).slice(2, 12) + Date.now().toString(36); localStorage.setItem("phoenix-vid", vid); } }
  catch (e) { vid = "anon"; }
  return vid;
}
export function track(name, detail) {
  try {
    if (typeof window === "undefined" || navigator.doNotTrack === "1") return;
    if (/^(localhost|127\.)/.test(location.hostname)) return;
    const body = JSON.stringify({ name, detail: detail == null ? null : String(detail).slice(0, 120), page: location.pathname, visitor: visitor() });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/event", new Blob([body], { type: "application/json" }));
    else fetch("/api/event", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
  } catch (e) {}
}
