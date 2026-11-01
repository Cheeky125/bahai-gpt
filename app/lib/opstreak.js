// Phoenix — obligatory prayer streak, kept only in this browser (localStorage).
export const KEY = "phoenix-op";
export const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "null") || { choice: "short", days: {} }; } catch (e) { return { choice: "short", days: {} }; } };
export const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
export const done = (d) => !!d && (d.short || d.long || (d.m && d.n && d.e));
export const keyOf = (y, m, d) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
export const shift = (k, n) => new Date(Date.parse(k) + n * 86400000).toISOString().slice(0, 10);
export function streaks(days, today) {
  let cur = 0, k = done(days[today]) ? today : shift(today, -1);
  while (done(days[k])) { cur++; k = shift(k, -1); }
  let best = 0, run = 0, prev = null;
  for (const d of Object.keys(days).filter((d) => done(days[d])).sort()) { run = prev && shift(prev, 1) === d ? run + 1 : 1; best = Math.max(best, run); prev = d; }
  return { cur, best: Math.max(best, cur) };
}

