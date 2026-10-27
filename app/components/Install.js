"use client";
import { useEffect, useState } from "react";

// "Install app" button. On Android/Chrome/Edge it opens the browser's install prompt;
// on iPhone/iPad (where browsers have no prompt) it shows how to add Phoenix to the home screen.
export default function Install() {
  const [prompt, setPrompt] = useState(null);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(true);
  const [tip, setTip] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    setInstalled(!!standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    const onPrompt = (e) => { e.preventDefault(); setPrompt(e); };
    const onInstalled = () => { setInstalled(true); setPrompt(null); };
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  if (installed || (!prompt && !ios)) return null;

  const click = async () => {
    if (prompt) { prompt.prompt(); await prompt.userChoice.catch(() => {}); setPrompt(null); }
    else setTip(!tip);
  };

  return (
    <span className="install">
      <button className="installbtn" onClick={click} aria-expanded={ios ? tip : undefined}>
        <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
        <span className="installtxt">Install app</span>
      </button>
      {tip && (
        <span className="installtip" role="dialog" aria-label="How to install">
          Tap <strong>Share</strong> <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "-2px" }}><path d="M12 3v13" /><path d="m7 8 5-5 5 5" /><path d="M5 12v8h14v-8" /></svg> at the bottom of Safari, then <strong>Add to Home Screen</strong>.
          <button className="installclose" onClick={() => setTip(false)} aria-label="Close">×</button>
        </span>
      )}
    </span>
  );
}
