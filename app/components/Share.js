"use client";
// Phoenix — share a passage as an image (tall for stories, square for posts). Drawn in the browser on a canvas;
// on phones it opens the share sheet (Instagram, WhatsApp…), elsewhere it saves the picture.
import { useEffect, useRef, useState } from "react";

const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="w" x1="0.5" y1="1" x2="0.5" y2="0"><stop offset="0" stop-color="#FFC93C"/><stop offset="0.45" stop-color="#F3701E"/><stop offset="1" stop-color="#B5170F"/></linearGradient><linearGradient id="i" x1="0.5" y1="1" x2="0.5" y2="0"><stop offset="0" stop-color="#FFE08A"/><stop offset="1" stop-color="#F79A1E"/></linearGradient><linearGradient id="b" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0" stop-color="#FFF1C2"/><stop offset="0.6" stop-color="#FFB627"/><stop offset="1" stop-color="#E4531A"/></linearGradient></defs><path d="M50 58C38 54 22 46 8 22C16 28 22 30 26 30C20 24 18 16 20 8C26 20 34 26 40 30C38 22 40 14 44 8C46 22 48 34 50 44Z" fill="url(#w)"/><path d="M50 58C62 54 78 46 92 22C84 28 78 30 74 30C80 24 82 16 80 8C74 20 66 26 60 30C62 22 60 14 56 8C54 22 52 34 50 44Z" fill="url(#w)"/><path d="M50 58C40 54 28 46 20 32C28 38 34 40 38 40C34 34 34 28 36 22C40 32 46 38 50 46Z" fill="url(#i)"/><path d="M50 58C60 54 72 46 80 32C72 38 66 40 62 40C66 34 66 28 64 22C60 32 54 38 50 46Z" fill="url(#i)"/><path d="M50 72C44 80 40 86 34 96C42 90 46 88 50 84C54 88 58 90 66 96C60 86 56 80 50 72Z" fill="url(#w)"/><path d="M50 76C48 84 49 90 50 98C51 90 52 84 50 76Z" fill="#FFC93C"/><path d="M50 30C56 38 57 50 54 62C53 68 51 72 50 76C49 72 47 68 46 62C43 50 44 38 50 30Z" fill="url(#b)"/><path d="M50 22C48 16 50 10 54 6C53 12 54 16 52 22Z" fill="#F3701E"/><path d="M50 22C53 22 55 25 54 28C53 30 51 31 50 31C49 31 47 30 46 28C45 25 47 22 50 22Z" fill="#F79A1E"/></svg>`;

const SIZES = { story: [1080, 1920], square: [1080, 1080] };

// Keep a long passage to whole sentences that fit; mark the cut with "…"
function shorten(text, max) {
  const t = text.replace(/\s*\n+\s*/g, " ").trim();
  if (t.length <= max) return t;
  const sentences = t.match(/[^.!?]+[.!?]+[”’)]*\s*/g) || [t];
  let out = "";
  for (const s of sentences) { if ((out + s).length > max) break; out += s; }
  return (out || t.slice(0, max).replace(/\s+\S*$/, "")).trim() + " …";
}

function wrap(ctx, text, width) {
  const lines = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const w of para.split(/\s+/)) {
      const test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > width && line) { lines.push(line); line = w; } else line = test;
    }
    lines.push(line);
  }
  return lines;
}

let logoImg = null;
const loadLogo = () => logoImg || (logoImg = new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(LOGO); }));

export async function drawShare(canvas, { text, author, source }, shape) {
  const [W, H] = SIZES[shape];
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  const css = getComputedStyle(document.body);
  const serif = (css.getPropertyValue("--font-serif") || "").trim() || "Georgia";
  const sans = (css.getPropertyValue("--font-sans") || "").trim() || "system-ui";
  try { await Promise.all([document.fonts.load(`48px ${serif}`), document.fonts.load(`600 32px ${sans}`)]); } catch (e) {}

  // background: night sky with an ember glow
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#1E1410"); bg.addColorStop(1, "#0E0806");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, H * 0.08, 0, W / 2, H * 0.08, W * 0.9);
  glow.addColorStop(0, "rgba(243,112,30,0.28)"); glow.addColorStop(1, "rgba(243,112,30,0)");
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

  const pad = 96, boxW = W - pad * 2;
  const logo = await loadLogo();
  const logoS = shape === "story" ? 132 : 96;
  const top = shape === "story" ? 230 : 84;
  if (logo) ctx.drawImage(logo, (W - logoS) / 2, top, logoS, logoS);

  const quote = "“" + shorten(text, shape === "story" ? 900 : 520) + "”";
  const story = shape === "story";
  const footerY = H - (story ? 170 : 72);
  const boxTop = top + logoS + (story ? 90 : 46), boxBottom = footerY - (story ? 90 : 44);
  // attribution block: author line + up to 2 (story) / 1 (square) source lines
  const authorPx = story ? 40 : 34, srcPx = story ? 32 : 28, srcLH = story ? 42 : 36;
  ctx.font = `${srcPx}px ${sans}`;
  let srcLines = source ? wrap(ctx, source, boxW) : [];
  if (srcLines.length > (story ? 2 : 1)) {
    srcLines = srcLines.slice(0, story ? 2 : 1);
    let l = srcLines[srcLines.length - 1];
    while (ctx.measureText(l + " …").width > boxW && l.includes(" ")) l = l.replace(/\s+\S*$/, "");
    srcLines[srcLines.length - 1] = l + " …";
  }
  let size = story ? 66 : 56, lines, lh, gap, attrH;
  for (; size >= 26; size -= 2) {
    ctx.font = `${size}px ${serif}`;
    lines = wrap(ctx, quote, boxW); lh = size * 1.42; gap = size * 0.9;
    attrH = authorPx * 1.3 + (srcLines.length ? 14 + srcLines.length * srcLH : 0);
    if (lines.length * lh + gap + attrH <= boxBottom - boxTop) break;
  }
  const blockH = lines.length * lh + gap + attrH;
  let y = boxTop + Math.max(0, (boxBottom - boxTop - blockH) / 2);
  ctx.fillStyle = "#F5EDE6"; ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.font = `${size}px ${serif}`;
  for (const l of lines) { ctx.fillText(l, W / 2, y); y += lh; }
  y += gap;
  ctx.fillStyle = "#FFB98A"; ctx.font = `600 ${authorPx}px ${sans}`;
  ctx.fillText(`— ${author || "The Bahá’í Writings"}`, W / 2, y);
  y += authorPx * 1.3 + 14;
  ctx.fillStyle = "#C4B3A8"; ctx.font = `${srcPx}px ${sans}`;
  for (const l of srcLines) { ctx.fillText(l, W / 2, y); y += srcLH; }

  // footer
  ctx.fillStyle = "#A8968A"; ctx.font = `600 ${shape === "story" ? 30 : 26}px ${sans}`;
  ctx.fillText("phoenixwritings.com", W / 2, footerY);
}

const fileName = (author) => `phoenix-${(author || "quote").toLowerCase().normalize("NFD").replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "")}.png`;

export function ShareImage({ r, text, onClose }) {
  const [shape, setShape] = useState(() => { try { return localStorage.getItem("phoenix-share-shape") || "story"; } catch (e) { return "story"; } });
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState(null);
  const canvas = useRef(null);
  const data = { text: text || r.excerpt || r.text, author: r.author, source: [r.book, r.section && r.section !== r.book ? r.section : ""].filter(Boolean).join(", ") };
  useEffect(() => {
    let alive = true;
    const c = canvas.current || (canvas.current = document.createElement("canvas"));
    drawShare(c, data, shape).then(() => { if (alive) setUrl(c.toDataURL("image/png")); });
    try { localStorage.setItem("phoenix-share-shape", shape); } catch (e) {}
    return () => { alive = false; };
  }, [shape]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const blob = () => new Promise((res) => canvas.current.toBlob(res, "image/png"));
  const share = async () => {
    setBusy(true);
    try {
      const file = new File([await blob()], fileName(r.author), { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file] });
      else save(file);
    } catch (e) { /* closed the share sheet */ }
    setBusy(false);
  };
  const save = async (file) => {
    const f = file || new File([await blob()], fileName(r.author), { type: "image/png" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(f); a.download = f.name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };
  return (
    <div className="sharewrap" role="dialog" aria-modal="true" aria-label="Share as image" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sharebox">
        <div className="sharehead">
          <div className="tabs" role="tablist">
            <button className="tab" role="tab" aria-selected={shape === "story"} onClick={() => setShape("story")}>Story</button>
            <button className="tab" role="tab" aria-selected={shape === "square"} onClick={() => setShape("square")}>Square</button>
          </div>
          <button className="iconbtn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className={`sharepreview ${shape}`}>{url ? <img src={url} alt="Preview of the image" /> : <div className="skeleton" style={{ height: "100%" }} />}</div>
        <div className="actions" style={{ justifyContent: "center" }}>
          <button className="act primary" onClick={share} disabled={!url || busy}>Share</button>
          <button className="act" onClick={() => save()} disabled={!url}>Save image</button>
        </div>
      </div>
    </div>
  );
}

export function ShareButton({ r, text, label = "Share image" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="act" onClick={() => setOpen(true)}>
        <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="2" /><path d="m21 15-4.5-4.5L7 20" /></svg>
        {label}
      </button>
      {open && <ShareImage r={r} text={text} onClose={() => setOpen(false)} />}
    </>
  );
}
