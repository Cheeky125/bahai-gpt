"use client";
// Phoenix — the home-page prayer streak: a circled, fiery number. Dim embers until today's obligatory
// prayer is marked as said, then the ring catches fire. Kept only on this device.
import { useEffect, useState } from "react";
import { load, save, done, keyOf, streaks } from "../lib/opstreak";
import { todayIn } from "../lib/sun";

const NAMES = { short: "Short", medium: "Medium", long: "Long" };

export function FireBadge({ n, lit, size = 76 }) {
  const flames = Math.min(12, 5 + Math.floor(n / 3)); // a longer streak, a bigger fire
  return (
    <svg className={`firebadge${lit ? " lit" : ""}`} viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="fbFire" x1="0.5" y1="1" x2="0.5" y2="0"><stop offset="0" stopColor="#FFC93C" /><stop offset="0.5" stopColor="#F3701E" /><stop offset="1" stopColor="#B5170F" /></linearGradient>
        <linearGradient id="fbNum" x1="0.5" y1="1" x2="0.5" y2="0"><stop offset="0" stopColor="#F3701E" /><stop offset="1" stopColor="#FFC93C" /></linearGradient>
        <radialGradient id="fbGlow"><stop offset="0.55" stopColor="#F3701E" stopOpacity=".45" /><stop offset="1" stopColor="#F3701E" stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#fbGlow)" className="fbglow" />
      {/* flames licking up round the ring */}
      <g className="fbflames">
        {Array.from({ length: flames }, (_, i) => {
          const a = (360 / flames) * i;
          return (
            <g key={i} transform={`rotate(${a} 50 50)`}>
              <path d="M50 2 C46 9 45 13 50 17 C55 13 54 9 50 2Z" fill="url(#fbFire)" className="fbflame" style={{ animationDelay: `${(i * 0.13) % 1}s` }} />
            </g>
          );
        })}
      </g>
      <circle cx="50" cy="50" r="33" className="fbring" />
      <circle cx="50" cy="50" r="29" className="fbinner" />
      <text x="50" y="50" dy=".35em" className="fbnum" fill={lit ? "url(#fbNum)" : undefined}>{n}</text>
    </svg>
  );
}

export default function StreakCard() {
  const [st, setSt] = useState(null);
  const [today, setToday] = useState(null);
  useEffect(() => {
    setSt(load());
    const [y, m, d] = todayIn(); setToday(keyOf(y, m, d));
  }, []);
  if (!st || !today) return null;
  const { cur, best } = streaks(st.days, today);
  const lit = done(st.days[today]);
  const choice = st.choice || "short";
  const used = Object.keys(st.days).length > 0;
  const markToday = () => {
    const n = { ...st, days: { ...st.days, [today]: { ...(st.days[today] || {}), [choice]: Date.now() } } };
    save(n); setSt(n);
  };
  return (
    <div className={`streakcard${lit ? " lit" : ""}`}>
      <a href="/obligatory" className="streakbadge" aria-label={`Prayer streak: ${cur} day${cur === 1 ? "" : "s"}`}>
        <FireBadge n={cur} lit={lit} />
      </a>
      <div className="streaktext">
        <a href="/obligatory" className="ftitle">{!used ? "Start a prayer streak" : lit ? `${cur}-day prayer streak` : cur ? `${cur}-day streak — keep it burning` : "Light your streak today"}</a>
        <span className="fdesc">{lit ? `Today’s obligatory prayer is said.${best > cur ? ` Best: ${best}` : ""}` : `Mark your daily obligatory prayer — only you can see it.`}</span>
        {!lit && choice !== "medium" && <button className="act" onClick={markToday}>✓ I’ve said today’s {NAMES[choice].toLowerCase()} prayer</button>}
        {!lit && choice === "medium" && <a className="act" href="/obligatory">Mark morning, noon &amp; evening</a>}
      </div>
    </div>
  );
}
