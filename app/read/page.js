import Logo from "../components/Logo";
import Install from "../components/Install";
import Bilingual from "../components/Bilingual";
import { ThemeToggle, Footer } from "../components/Phoenix";
import { SavedLink } from "../components/Saved";

export const metadata = {
  title: "Read side by side — Phoenix",
  description: "The Hidden Words, Kitáb-i-Aqdas, Kitáb-i-Íqán, Gleanings and more in two languages side by side — English beside the original Persian or Arabic, or any two translations.",
};

export default function Page() {
  return (
    <>
      <header className="header bar">
        <a className="brand" href="/" style={{ textDecoration: "none" }}><Logo id="rd" />Phoenix</a>
        <nav className="nav"><Install /><a href="/">Search</a><a href="/today">Today</a><a href="/prayers">Prayers</a><SavedLink /><ThemeToggle /></nav>
      </header>
      <main className="ptop wide" style={{ paddingBottom: 64, gap: 16 }}>
        <Bilingual />
      </main>
      <Footer />
    </>
  );
}
