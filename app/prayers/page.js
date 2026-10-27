import { PRAYERS } from "../lib/engine";
import Prayers from "../components/Prayers";

export const metadata = {
  title: "Prayers, Stories & Devotionals — Phoenix",
  description: "Browse Bahá’í prayers by theme, each shown in full, or build a devotional on any theme.",
};

export default function PrayersPage() {
  // Theme list for browsing, in the order of the prayer book.
  const groups = [];
  for (const p of PRAYERS) {
    let g = groups.find((x) => x.name === p.group);
    if (!g) groups.push((g = { name: p.group, themes: [] }));
    let t = g.themes.find((x) => x.name === p.theme);
    if (!t) g.themes.push((t = { name: p.theme, count: 0 }));
    t.count++;
  }
  // Show everyday prayers first.
  const order = ["General Prayers", "Obligatory Prayers", "Occasional Prayers", "Special Tablets", "More Prayer Books"];
  groups.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
  return <Prayers groups={groups} />;
}
