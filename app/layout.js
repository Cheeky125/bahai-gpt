import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const sans = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-sans", display: "swap" });
const serif = Source_Serif_4({ subsets: ["latin", "latin-ext"], variable: "--font-serif", display: "swap" });

export const metadata = {
  metadataBase: new URL("https://www.phoenixwritings.com"),
  openGraph: { title: "Phoenix — Search the Bahá’í Writings", description: "Search the Bahá’í Writings, find prayers, stories and songs, and build devotionals.", url: "https://www.phoenixwritings.com", siteName: "Phoenix", images: [{ url: "/icon-512.png", width: 512, height: 512 }] },
  title: "Phoenix — Search the Bahá’í Writings",
  description: "Search the Bahá’í Writings by theme or question. Every passage is shown word for word, with its exact source.",
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/icon-192.png", sizes: "192x192", type: "image/png" }], apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Phoenix", statusBarStyle: "black-translucent" },
  applicationName: "Phoenix",
};

export const viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#FBF8F4" }, { media: "(prefers-color-scheme: dark)", color: "#140C09" }],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Apply the saved light/dark choice before the page paints, to avoid a flash.
const themeScript = `try{var t=localStorage.getItem('phoenix-theme');if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}<Analytics /></body>
    </html>
  );
}
