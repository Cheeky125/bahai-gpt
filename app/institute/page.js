import Logo from "../components/Logo";
import Install from "../components/Install";
import { ThemeToggle, Footer } from "../components/Phoenix";

export const metadata = {
  title: "Institute Companion — Phoenix",
  description: "For each book of the Ruhi Institute, find passages from the Writings on its themes. The books themselves are on ruhi.org.",
};

// Book and unit titles as published by the Ruhi Institute (ruhi.org). Phoenix does not reproduce any
// Ruhi material; each unit links to searches of the Writings on that unit's themes, chosen by Phoenix.
const q = (text) => ({ text, href: `/?q=${encodeURIComponent(text)}` });
const prayers = (text, theme) => ({ text, href: `/prayers?theme=${encodeURIComponent(theme)}` });
const BOOKS = [
  {
    n: 1, title: "Reflections on the Life of the Spirit", pdf: "https://www.ruhi.org/full_texts/RUHI0010_RLS_BK1_EN_4.1.2.PE_FullText_20200520.pdf",
    units: [
      { title: "Understanding the Bahá’í Writings", topics: [q("The power of the Word of God"), q("Reading the Writings every morning and evening"), q("Truthfulness"), q("Backbiting"), q("Kindness and a kindly tongue")] },
      { title: "Prayer", topics: [q("The importance of prayer"), q("The right attitude in prayer"), q("Meditation"), q("Obligatory prayer"), { text: "Browse all prayers", href: "/prayers" }] },
      { title: "Life and Death", topics: [q("The purpose of our life in this world"), q("What happens to the soul after death"), q("The progress of the soul in the next world"), prayers("Prayers for the departed", "The Departed")] },
    ],
  },
  {
    n: 2, title: "Arising to Serve", pdf: "https://www.ruhi.org/full_texts/RUHI0060_AS_BK2_EN_2.1.1.PE_FullText_20200930.pdf",
    units: [
      { title: "The Joy of Teaching", topics: [q("The joy of teaching the Cause"), q("Teaching is the most meritorious of deeds"), q("Arise to serve")] },
      { title: "Uplifting Conversations", topics: [q("Speaking with wisdom and kindness"), q("Uplifting conversation"), q("Friendship and fellowship")] },
      { title: "Deepening Themes", topics: [q("The eternal Covenant of God"), q("Progressive revelation"), q("The oneness of humanity"), q("The life of the soul")] },
    ],
  },
  {
    n: 3, title: "Teaching Children’s Classes, Grade 1", pdf: "https://www.ruhi.org/full_texts/RUHI0110_CC1_BK3_EN_2.2.1.PE_FullText_20210930.pdf",
    units: [
      { title: "Some Principles of Bahá’í Education", topics: [q("The education of children"), q("Spiritual education"), q("Man is a mine rich in gems")] },
      { title: "Lessons for Children’s Classes, Grade 1", topics: [prayers("Prayers for children", "Children"), q("Spiritual qualities"), q("Generosity"), q("Truthfulness")] },
    ],
  },
  {
    n: 4, title: "The Twin Manifestations", pdf: "https://www.ruhi.org/full_texts/RUHI0210_TWM_BK4_EN_2.1.1.PE_FullText_20211217.pdf",
    units: [
      { title: "The Greatness of This Day", topics: [q("The greatness of this Day"), q("The Day of God promised in all the scriptures"), q("The coming of age of humanity")] },
      { title: "The Life of the Báb", topics: [q("The declaration of the Báb"), q("The Báb's imprisonment in Máh-Kú"), q("The martyrdom of the Báb"), { text: "Stories of the early believers", href: "/prayers?tab=stories" }] },
      { title: "The Life of Bahá’u’lláh", topics: [q("Bahá'u'lláh in the Síyáh-Chál"), q("Bahá'u'lláh's exile to Baghdad"), q("The declaration of Bahá'u'lláh in the Garden of Riḍván"), q("Bahá'u'lláh's imprisonment in 'Akká")] },
    ],
  },
  {
    n: 5, title: "Releasing the Powers of Junior Youth", pdf: "https://www.ruhi.org/full_texts/RUHI0260_JY1_BK5_EN_2.1.1.PE_FullText_20220712.pdf",
    units: [
      { title: "Life’s Springtime", topics: [q("The period of youth"), q("Youth and service to humanity"), prayers("Prayers for youth", "Youth")] },
      { title: "An Age of Promise", topics: [q("Junior youth"), q("Spiritual empowerment of junior youth"), q("Developing capacity for service")] },
      { title: "Serving as an Animator", topics: [q("Animators of junior youth groups"), q("Accompanying others in service"), q("Education and the moral development of youth")] },
    ],
  },
  {
    n: 6, title: "Teaching the Cause", pdf: "https://www.ruhi.org/full_texts/RUHI0310_TCH_BK6_EN_2.1.1.PE_FullText_20230420.pdf",
    units: [
      { title: "The Spiritual Nature of Teaching", topics: [q("Teaching the Cause of God"), q("The confirmations of the Holy Spirit in teaching"), prayers("Prayers for teaching", "Teaching")] },
      { title: "Qualities and Attitudes Essential for Teaching", topics: [q("Detachment of the teacher"), q("Teaching with wisdom"), q("Humility"), q("A pure and sincere heart")] },
      { title: "The Act of Teaching", topics: [q("Teaching receptive souls"), q("Giving the Message"), q("Firesides and home visits")] },
    ],
  },
  {
    n: 7, title: "Walking Together on a Path of Service", pdf: "https://www.ruhi.org/full_texts/RUHI0360_WLK_BK7_EN_2.1.1.PE_FullText_20240225.pdf",
    units: [
      { title: "The Spiritual Dynamics of Advancing on a Path of Service", topics: [q("Walking a path of service"), q("Service as worship"), q("Humility in service")] },
      { title: "Serving as a Tutor of the Institute Courses", topics: [q("The training institute"), q("Study circles"), q("Accompaniment")] },
      { title: "Promoting the Arts at the Grassroots", topics: [q("The arts"), q("Music"), q("Art is worship")] },
    ],
  },
  {
    n: 8, title: "The Covenant of Bahá’u’lláh", pdf: "https://www.ruhi.org/full_texts/RUHI2100_COV_BK8_EN_1.1.1.PE_FullText_20260324.pdf",
    units: [
      { title: "The Center of the Covenant and His Will and Testament", topics: [q("'Abdu'l-Bahá, the Center of the Covenant"), q("The Will and Testament of 'Abdu'l-Bahá"), q("Firmness in the Covenant"), prayers("Prayers for firmness in the Covenant", "Firmness in the Covenant")] },
      { title: "The Guardian of the Faith", topics: [q("The Guardianship"), q("Shoghi Effendi, the Guardian of the Cause"), q("The interpretation of the Writings")] },
      { title: "The Universal House of Justice", topics: [q("The Universal House of Justice"), q("Divine guidance for the Universal House of Justice"), q("The Administrative Order")] },
    ],
  },
];
const LATER = [
  [9, "Gaining an Historical Perspective"], [10, "Building Vibrant Communities"], [11, "Material Means"],
  [12, "Family and the Community"], [13, "Engaging in Social Action"], [14, "Participating in Public Discourse"],
];

export default function Institute() {
  return (
    <>
      <header className="header bar">
        <a className="brand" href="/" style={{ textDecoration: "none" }}><Logo id="in" />Phoenix</a>
        <nav className="nav"><Install /><a href="/">Search</a><a href="/prayers">Prayers</a><ThemeToggle /></nav>
      </header>
      <main className="ptop" style={{ paddingBottom: 64 }}>
        <h1>Institute Companion</h1>
        <p>Studying a book of the Ruhi Institute? For each unit, tap a theme to find passages on it in the Writings. The books themselves are free to download from <a href="https://www.ruhi.org/en/materials-in-your-language" target="_blank" rel="noopener noreferrer">ruhi.org</a>.</p>
        <div className="books">
          {BOOKS.map((b) => (
            <details key={b.n} className="book" open={b.n === 1}>
              <summary>
                <span className="booknum">Book {b.n}</span>
                <span className="booktitle">{b.title}</span>
              </summary>
              <div className="bookbody">
                {b.units.map((u, i) => (
                  <div key={u.title} className="unit">
                    <div className="unittitle"><span className="unitnum">Unit {i + 1}</span> {u.title}</div>
                    <div className="themes left">
                      {u.topics.map((t) => <a key={t.text} className="theme" href={t.href}>{t.text}</a>)}
                    </div>
                  </div>
                ))}
                <a className="act link" href={b.pdf} target="_blank" rel="noopener noreferrer" style={{ alignSelf: "flex-start" }}>
                  Get Book {b.n} on ruhi.org
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7" /><path d="M8 7h9v9" /></svg>
                </a>
              </div>
            </details>
          ))}
          <div className="laterbooks">
            <div className="label">Later books</div>
            <p className="note">{LATER.map(([n, t]) => `Book ${n}: ${t}`).join(" · ")}. These are pre-publication or still in development; see <a href="https://www.ruhi.org/en/walking-a-path-of-service" target="_blank" rel="noopener noreferrer">ruhi.org</a>.</p>
          </div>
        </div>
        <p className="note" style={{ fontSize: 13 }}>Book and unit titles are those published by the Ruhi Institute. Phoenix is not affiliated with the Ruhi Institute and does not reproduce its materials; the themes linked here are suggestions for finding passages in the Writings.</p>
      </main>
      <Footer />
    </>
  );
}
