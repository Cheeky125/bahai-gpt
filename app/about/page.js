import Logo from "../components/Logo";

export const metadata = { title: "About — Phoenix" };

export default function About() {
  return (
    <>
      <header className="header bar">
        <a className="brand" href="/" style={{ textDecoration: "none" }}><Logo id="a" />Phoenix</a>
        <nav className="nav"><a href="/">Search</a><a href="/prayers">Prayers</a></nav>
      </header>
      <main className="page">
        <h1>About Phoenix</h1>
        <p>Phoenix helps you find passages in the Bahá’í Writings by theme or question. It searches both the exact words and the meaning of what you ask, then shows the passages themselves, word for word, with the book, section and paragraph they come from.</p>
        <p>Phoenix never writes or paraphrases scripture. Everything you see in a result is the published text, and every result links to the official Bahá’í Reference Library so you can read it in context.</p>
        <p>For simple questions, a short answer may appear above the passages. A <strong>Quick fact</strong> is a hand-checked answer taken from the passages shown. A <strong>Quick answer</strong> is written by AI using only the passages shown, and cites them by number — always read the passages themselves.</p>
        <p>The <a href="/prayers">Prayers</a> page shows nearly 500 prayers in full — from <em>Bahá’í Prayers</em>, <em>Prayers and Meditations by Bahá’u’lláh</em> and the two volumes of <em>Additional Prayers</em> — along with stories of the early believers from ‘Abdu’l-Bahá’s <em>Memorials of the Faithful</em>. It can also put together a devotional on any theme from prayers, the Writings and these stories, quoted word for word.</p>
        <h2 className="serif">What’s included</h2>
        <p>The writings of Bahá’u’lláh, the Báb and ‘Abdu’l-Bahá, the writings of Shoghi Effendi, the messages of the Universal House of Justice, Bahá’í Prayers, and the compilations prepared by the Research Department, as published in the <a href="https://www.bahai.org/library/authoritative-texts/" target="_blank" rel="noopener noreferrer">Bahá’í Reference Library</a>.</p>
        <h2 className="serif">Please note</h2>
        <p>Phoenix is an independent study tool. It is not an official publication of any Bahá’í institution and does not interpret the Writings. Paragraph numbers are given as in the source where printed; otherwise they are counted within each section and may differ slightly from the Library’s numbering. If you find an error, please let us know.</p>
      </main>
      <footer className="footer">An independent study tool, not an official publication of any Bahá’í institution.</footer>
    </>
  );
}
