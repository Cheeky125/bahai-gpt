import Logo from "../components/Logo";
import Today from "../components/Today";
import { Footer } from "../components/Phoenix";
import SiteNav from "../components/SiteNav";

export const metadata = {
  title: "Today — Phoenix",
  description: "Today’s Bahá’í date, a morning and evening reading from the Writings, the next Feast and Holy Days, and sunrise and sunset for the Fast.",
};

export default function Page() {
  return (
    <>
      <header className="header bar">
        <a className="brand" href="/" style={{ textDecoration: "none" }}><Logo id="td" />Phoenix</a>
        <SiteNav />
      </header>
      <main className="ptop" style={{ paddingBottom: 64, gap: 18 }}>
        <Today />
      </main>
      <Footer />
    </>
  );
}
