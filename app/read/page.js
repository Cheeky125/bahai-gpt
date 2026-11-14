import Logo from "../components/Logo";
import Bilingual from "../components/Bilingual";
import { Footer } from "../components/Phoenix";
import SiteNav from "../components/SiteNav";

export const metadata = {
  title: "Read side by side — Phoenix",
  description: "The Hidden Words, Kitáb-i-Aqdas, Kitáb-i-Íqán, Gleanings and more in two languages side by side — English beside the original Persian or Arabic, or any two translations.",
};

export default function Page() {
  return (
    <>
      <header className="header bar">
        <a className="brand" href="/" style={{ textDecoration: "none" }}><Logo id="rd" />Phoenix</a>
        <SiteNav />
      </header>
      <main className="ptop wide" style={{ paddingBottom: 64, gap: 16 }}>
        <Bilingual />
      </main>
      <Footer />
    </>
  );
}
