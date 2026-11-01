import Logo from "../components/Logo";
import Install from "../components/Install";
import Obligatory from "../components/Obligatory";
import { ThemeToggle, Footer } from "../components/Phoenix";
import { SavedLink } from "../components/Saved";

export const metadata = {
  title: "Obligatory Prayer — Phoenix",
  description: "The Short, Medium and Long Obligatory Prayers word for word, today’s prayer times where you are, a compass to the Qiblih, and a private daily streak.",
};

export default function Page() {
  return (
    <>
      <header className="header bar">
        <a className="brand" href="/" style={{ textDecoration: "none" }}><Logo id="ob" />Phoenix</a>
        <nav className="nav"><Install /><a href="/">Search</a><a href="/today">Today</a><a href="/prayers">Prayers</a><SavedLink /><ThemeToggle /></nav>
      </header>
      <main className="ptop" style={{ paddingBottom: 64, gap: 16 }}>
        <Obligatory />
      </main>
      <Footer />
    </>
  );
}
