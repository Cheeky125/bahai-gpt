import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const sans = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-sans", display: "swap" });
const serif = Source_Serif_4({ subsets: ["latin", "latin-ext"], variable: "--font-serif", display: "swap" });

export const metadata = {
  title: "Phoenix — Search the Bahá’í Writings",
  description: "Search the Bahá’í Writings by theme or question. Every passage is shown word for word, with its exact source.",
  icons: { icon: "/icon.svg" },
};

// Apply the saved light/dark choice before the page paints, to avoid a flash.
const themeScript = `try{var t=localStorage.getItem('phoenix-theme');if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
