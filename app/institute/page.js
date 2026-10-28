import Logo from "../components/Logo";
import Install from "../components/Install";
import RuhiStudy from "../components/RuhiStudy";
import { ThemeToggle, Footer } from "../components/Phoenix";
import { ruhiQuoteCount } from "../lib/engine";

export const metadata = {
  title: "Ruhi Institute — Phoenix",
  description: "Go through the quotes from the Writings in each Ruhi book, section by section, exactly as the book quotes them — and practise memorizing them.",
};

// Book and unit titles as published by the Ruhi Institute (ruhi.org). Phoenix does not reproduce any Ruhi
// material: it only knows which words of the Writings each section quotes (scripts/build_ruhi_excerpts.py).
const BOOKS = [
  {
    n: 1, title: "Reflections on the Life of the Spirit", pdf: "https://www.ruhi.org/full_texts/RUHI0010_RLS_BK1_EN_4.1.2.PE_FullText_20200520.pdf",
    units: [
      { title: "Understanding the Bahá’í Writings" },
      { title: "Prayer" },
      { title: "Life and Death" },
    ],
  },
  {
    n: 2, title: "Arising to Serve", pdf: "https://www.ruhi.org/full_texts/RUHI0060_AS_BK2_EN_2.1.1.PE_FullText_20200930.pdf",
    units: [
      { title: "The Joy of Teaching" },
      { title: "Uplifting Conversations" },
      { title: "Deepening Themes" },
    ],
  },
  {
    n: 3, title: "Teaching Children’s Classes, Grade 1", pdf: "https://www.ruhi.org/full_texts/RUHI0110_CC1_BK3_EN_2.2.1.PE_FullText_20210930.pdf",
    units: [
      { title: "Some Principles of Bahá’í Education" },
      { title: "Lessons for Children’s Classes, Grade 1" },
    ],
  },
  {
    n: 4, title: "The Twin Manifestations", pdf: "https://www.ruhi.org/full_texts/RUHI0210_TWM_BK4_EN_2.1.1.PE_FullText_20211217.pdf",
    units: [
      { title: "The Greatness of This Day" },
      { title: "The Life of the Báb" },
      { title: "The Life of Bahá’u’lláh" },
    ],
  },
  {
    n: 5, title: "Releasing the Powers of Junior Youth", pdf: "https://www.ruhi.org/full_texts/RUHI0260_JY1_BK5_EN_2.1.1.PE_FullText_20220712.pdf",
    units: [
      { title: "Life’s Springtime" },
      { title: "An Age of Promise" },
      { title: "Serving as an Animator" },
    ],
  },
  {
    n: 6, title: "Teaching the Cause", pdf: "https://www.ruhi.org/full_texts/RUHI0310_TCH_BK6_EN_2.1.1.PE_FullText_20230420.pdf",
    units: [
      { title: "The Spiritual Nature of Teaching" },
      { title: "Qualities and Attitudes Essential for Teaching" },
      { title: "The Act of Teaching" },
    ],
  },
  {
    n: 7, title: "Walking Together on a Path of Service", pdf: "https://www.ruhi.org/full_texts/RUHI0360_WLK_BK7_EN_2.1.1.PE_FullText_20240225.pdf",
    units: [
      { title: "The Spiritual Dynamics of Advancing on a Path of Service" },
      { title: "Serving as a Tutor of the Institute Courses" },
      { title: "Promoting the Arts at the Grassroots" },
    ],
  },
  {
    n: 8, title: "The Covenant of Bahá’u’lláh", pdf: "https://www.ruhi.org/full_texts/RUHI2100_COV_BK8_EN_1.1.1.PE_FullText_20260324.pdf",
    units: [
      { title: "The Center of the Covenant and His Will and Testament" },
      { title: "The Guardian of the Faith" },
      { title: "The Universal House of Justice" },
    ],
  },
];
const LATER = [
  [9, "Gaining an Historical Perspective"], [10, "Building Vibrant Communities"], [11, "Material Means"],
  [12, "Family and the Community"], [13, "Engaging in Social Action"], [14, "Participating in Public Discourse"],
];

export default function Institute() {
  const books = BOOKS.map((b) => ({ ...b, units: b.units.map((u, i) => ({ title: u.title, count: ruhiQuoteCount(b.n, i + 1) })) }));
  return (
    <>
      <header className="header bar">
        <a className="brand" href="/" style={{ textDecoration: "none" }}><Logo id="in" />Phoenix</a>
        <nav className="nav"><Install /><a href="/">Search</a><a href="/prayers">Prayers</a><ThemeToggle /></nav>
      </header>
      <main className="ptop" style={{ paddingBottom: 64 }}>
        <RuhiStudy books={books} later={LATER} />
      </main>
      <Footer />
    </>
  );
}
