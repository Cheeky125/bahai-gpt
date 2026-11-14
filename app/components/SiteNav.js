"use client";
// Phoenix — the one top menu used on every page. On phones most links hide (the bottom bar has them);
// what stays is the install button, the prayer streak, saved passages and light/dark.
import { usePathname } from "next/navigation";
import Install from "./Install";
import { SavedLink } from "./Saved";
import { ThemeToggle } from "./Phoenix";

const LINKS = [
  ["/", "Search"],
  ["/today", "Today"],
  ["/prayers", "Prayers"],
  ["/institute", "Ruhi"],
  ["/read", "Read"],
  ["/about", "About"],
];

export default function SiteNav({ install = true }) {
  const path = usePathname() || "";
  const here = (href) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));
  return (
    <nav className="nav" aria-label="Phoenix">
      {install && <Install />}
      {LINKS.filter(([href]) => !(href === "/" && path === "/")).map(([href, label]) => (
        <a key={href} href={href} aria-current={here(href) ? "page" : undefined}>{label}</a>
      ))}
      <SavedLink />
      <ThemeToggle />
    </nav>
  );
}
