// Phoenix — web app manifest: lets people install Phoenix on their phone or computer like an app.
export default function manifest() {
  return {
    name: "Phoenix — Search the Bahá’í Writings",
    short_name: "Phoenix",
    description: "Search the Bahá’í Writings, find prayers, stories and songs, and build devotionals.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#140C09",
    theme_color: "#140C09",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Prayers", url: "/prayers", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Build a devotional", url: "/prayers?tab=devotional", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
