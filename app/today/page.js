import Logo from "../components/Logo";
import Install from "../components/Install";
import Today from "../components/Today";
import { ThemeToggle, Footer } from "../components/Phoenix";
import { SavedLink } from "../components/Saved";

export const metadata = {
  title: "Today — Phoenix",
  description: "Today’s Bahá’í date, a morning and evening reading from the Writings, the next Feast and Holy Days, and sunrise and sunset for the Fast.",
};

export default function Page() {
  return (
    <>
      <header className="header bar">
        <a className="brand" href="/" style={{ textDecoration: "none" }}><Logo id="td" />Phoenix</a>
        <nav className="nav"><Install /><a href="/">Search</a><a href="/prayers">Prayers</a><a href="/institute">Ruhi</a><SavedLink /><ThemeToggle /></nav>
      </header>
      <main className="ptop" style={{ paddingBottom: 64, gap: 18 }}>
        <Today />
      </main>
      <Footer />
    </>
  );
}
