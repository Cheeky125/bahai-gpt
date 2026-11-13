import Logo from "../components/Logo";
import { BottomNav } from "../components/Phoenix";

export const metadata = { title: "Privacy — Phoenix" };

export default function Privacy() {
  return (
    <>
      <header className="header bar">
        <a className="brand" href="/" style={{ textDecoration: "none" }}><Logo id="pv" />Phoenix</a>
        <nav className="nav"><a href="/">Search</a><a href="/today">Today</a><a href="/prayers">Prayers</a></nav>
      </header>
      <main className="page">
        <h1>Privacy</h1>
        <p>Phoenix has no accounts and asks for no names, emails or passwords.</p>
        <h2 className="serif">Kept only on your device</h2>
        <p>Your saved passages, your prayer streak, your Ruhi progress, your place (for prayer times and the Qiblih), your language and theme are stored in your own browser. They never leave your device, and clearing your browser’s site data removes them.</p>
        <h2 className="serif">What is sent to other services</h2>
        <p><strong>Searches.</strong> What you type is sent to Anthropic (Claude), to reword the question and sometimes write a short answer, and to Voyage AI, to search by meaning. Phoenix does not store your searches.</p>
        <p><strong>Your city.</strong> If you type a city instead of using your location, its name is looked up with Open-Meteo’s free place finder.</p>
        <p><strong>Prayers in other languages and sung prayers</strong> come from BahaiPrayers.net. Sung prayers play through YouTube’s privacy-enhanced mode (youtube-nocookie.com).</p>
        <p><strong>Feedback.</strong> If you send feedback, your message is stored so it can be read. Please don’t include personal details.</p>
        <p><strong>Usage counts.</strong> Phoenix may count which features are used (for example, how often a sung prayer is played), with a random number per browser so visitors can be counted without knowing who they are. No names, no searches and no network addresses are stored with these counts.</p>
        <p>Like every website, the hosting service (Vercel) briefly keeps standard technical logs, such as network addresses, to keep the site running and secure.</p>
        <h2 className="serif">Texts</h2>
        <p>The texts of the Writings are © Bahá’í International Community and come from the <a href="https://www.bahai.org/library/" target="_blank" rel="noopener noreferrer">Bahá’í Reference Library</a>. Phoenix is an independent study tool, not an official publication of any Bahá’í institution.</p>
      </main>
      <footer className="footer">An independent study tool, not an official publication of any Bahá’í institution.</footer>
      <BottomNav />
    </>
  );
}
