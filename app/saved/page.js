import Logo from "../components/Logo";
import Install from "../components/Install";
import SavedList from "../components/SavedList";
import { ThemeToggle, Footer } from "../components/Phoenix";

export const metadata = { title: "Saved — Phoenix", description: "Your saved prayers, passages and stories." };

export default function Page() {
  return (
    <>
      <header className="header bar">
        <a className="brand" href="/" style={{ textDecoration: "none" }}><Logo id="sv" />Phoenix</a>
        <nav className="nav"><Install /><a href="/">Search</a><a href="/today">Today</a><a href="/prayers">Prayers</a><ThemeToggle /></nav>
      </header>
      <main className="ptop" style={{ paddingBottom: 64, gap: 16 }}>
        <SavedList />
      </main>
      <Footer />
    </>
  );
}
