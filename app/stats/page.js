// Phoenix — private stats: how people use the site (anonymous totals from db/4_events.sql).
// Visits and page views are in Vercel Analytics; this page shows the clicks.
import Logo from "../components/Logo";
import { ThemeToggle } from "../components/Phoenix";
import { notFound } from "next/navigation";

export const metadata = { title: "Stats — Phoenix", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const LABELS = {
  search: "Searches", feature_card: "Home feature cards", tab_bar: "Phone tab bar", prayer_theme: "Prayer themes opened",
  devotional: "Devotionals built", sung_play: "Sung prayers played", share_open: "Share image opened", share_image: "Images shared",
  save_image: "Images saved", save: "Saved to favourites", copy: "Copied a passage", language: "Languages picked",
  read_pair: "Side-by-side reading", compass_open: "Qiblih compass opened", compass_facing: "Found the Qiblih",
  prayer_marked: "Obligatory prayer marked", ruhi_unit: "Ruhi units opened", ruhi_practice: "Ruhi practice", ruhi_memorized: "Ruhi quotes memorized",
  story_open: "Stories opened", song_open: "Songs opened", link_out: "Links out", today_card: "Today card (home)",
  feedback: "Feedback sent", install: "Install app clicked", obligatory_choice: "Obligatory prayer chosen", unsave: "Removed from favourites",
};
const label = (n) => LABELS[n] || n.replace(/_/g, " ");

async function stats(days) {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  const headers = { apikey: key, "Content-Type": "application/json" };
  if (key && key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/phoenix_stats`, { method: "POST", headers, body: JSON.stringify({ days }), cache: "no-store" });
  if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

export default async function Page({ searchParams }) {
  const p = await searchParams;
  // Private: the page only exists with ?key= matching STATS_KEY (set in Vercel). Without it, it's a normal 404.
  if (!process.env.STATS_KEY || p?.key !== process.env.STATS_KEY) notFound();
  const days = [1, 7, 30, 90].includes(+p?.days) ? +p.days : 7;
  let s = null, err = null;
  try { s = await stats(days); } catch (e) { err = String(e.message || e); }
  const byDay = s?.by_day || [];
  const maxDay = Math.max(1, ...byDay.map((d) => d.events));
  const byName = s?.by_name || [];
  const maxName = Math.max(1, ...byName.map((n) => n.total));
  const details = (name) => (s?.top_details || []).filter((t) => t.name === name);
  return (
    <>
      <header className="header bar">
        <a className="brand" href="/" style={{ textDecoration: "none" }}><Logo id="st" />Phoenix</a>
        <nav className="nav"><a href="/">Search</a><ThemeToggle /></nav>
      </header>
      <main className="ptop wide" style={{ paddingBottom: 64, gap: 18 }}>
        <h1>Stats</h1>
        <p className="note">What people click on Phoenix, counted anonymously. For visitors, page views, countries and devices, see <a href="https://vercel.com/terells-projects-bc735bbe/phoenix-writings/analytics" target="_blank" rel="noopener noreferrer">Vercel Analytics</a>.</p>
        <div className="chips left" role="group" aria-label="Time range">
          {[[1, "Today"], [7, "7 days"], [30, "30 days"], [90, "90 days"]].map(([d, t]) => <a key={d} className="chip" aria-pressed={d === days} href={`/stats?days=${d}&key=${encodeURIComponent(p.key)}`}>{t}</a>)}
        </div>
        {err && <p className="empty">Stats aren’t set up yet ({err.slice(0, 80)}). Run db/4_events.sql in Supabase.</p>}
        {s && (
          <>
            <div className="stattiles">
              <div className="stattile"><span className="statnum">{s.visitors}</span><span className="statlbl">people clicking</span></div>
              <div className="stattile"><span className="statnum">{s.events}</span><span className="statlbl">clicks</span></div>
              <div className="stattile"><span className="statnum">{byName.find((n) => n.name === "search")?.total || 0}</span><span className="statlbl">searches</span></div>
              <div className="stattile"><span className="statnum">{s.feedback}</span><span className="statlbl">feedback messages</span></div>
            </div>

            {days > 1 && byDay.length > 0 && (
              <section className="tcard2">
                <div className="tlabel">Clicks per day</div>
                <div className="daybars" role="img" aria-label={`Clicks per day: ${byDay.map((d) => `${d.day} ${d.events}`).join(", ")}`}>
                  {byDay.map((d) => (
                    <div key={d.day} className="daybar" title={`${d.day}: ${d.events} clicks by ${d.visitors} people`}>
                      <span className="dval">{d.events}</span>
                      <span className="dfill" style={{ height: `${Math.max(2, (d.events / maxDay) * 100)}%` }} />
                      <span className="dlbl">{d.day.slice(5).replace("-", "/")}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="tcard2">
              <div className="tlabel">What people clicked</div>
              {byName.length === 0 && <p className="note">No clicks yet in this period.</p>}
              <div className="hbars">
                {byName.map((n) => (
                  <details key={n.name} className="hbar">
                    <summary title={`${n.total} clicks by ${n.visitors} people`}>
                      <span className="hname">{label(n.name)}</span>
                      <span className="htrack"><span className="hfill" style={{ width: `${(n.total / maxName) * 100}%` }} /></span>
                      <span className="hval">{n.total}<span className="hppl"> · {n.visitors} {n.visitors === 1 ? "person" : "people"}</span></span>
                    </summary>
                    {details(n.name).length > 0 && (
                      <ul className="hdetails">{details(n.name).map((t) => <li key={t.detail}><span>{t.detail}</span><span>{t.total}</span></li>)}</ul>
                    )}
                  </details>
                ))}
              </div>
              {byName.length > 0 && <p className="note" style={{ fontSize: 13 }}>Tap a row to see the top themes, languages, books and so on.</p>}
            </section>

            {(s.pages || []).length > 0 && (
              <section className="tcard2">
                <div className="tlabel">Where the clicks happen</div>
                <ul className="hdetails">{s.pages.map((pg) => <li key={pg.page}><span>{pg.page}</span><span>{pg.total}</span></li>)}</ul>
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
