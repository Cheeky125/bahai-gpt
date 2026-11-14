import Logo from "../components/Logo";
import SavedList from "../components/SavedList";
import { Footer } from "../components/Phoenix";
import SiteNav from "../components/SiteNav";

export const metadata = { title: "Saved — Phoenix", description: "Your saved prayers, passages and stories." };

export default function Page() {
  return (
    <>
      <header className="header bar">
        <a className="brand" href="/" style={{ textDecoration: "none" }}><Logo id="sv" />Phoenix</a>
        <SiteNav />
      </header>
      <main className="ptop" style={{ paddingBottom: 64, gap: 16 }}>
        <SavedList />
      </main>
      <Footer />
    </>
  );
}
