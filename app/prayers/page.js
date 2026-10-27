import { PRAYERS } from "../lib/engine";
import Prayers from "../components/Prayers";

export const metadata = {
  title: "Prayers, Stories & Songs — Phoenix",
  description: "Bahá’í prayers in full, stories of the early believers, songs to sing together, and a devotional builder.",
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
  // Count the matching prayers from the other prayer books on each theme too.
  for (const p of PRAYERS) {
    if (!p.alsoTheme || p.dup) continue;
    for (const g of groups) { const t = g.themes.find((x) => x.name === p.alsoTheme); if (t) t.count++; }
  }
  // Show everyday prayers first.
  const order = ["General Prayers", "Obligatory Prayers", "Occasional Prayers", "Special Tablets", "More Prayer Books"];
  groups.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
  return <Prayers groups={groups} />;
}
