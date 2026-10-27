# Split The Dawn-Breakers (Word file from bahai-library.com) into story-sized parts for Phoenix.
# Usage: python3 -I build_db.py <dawnbreakers.docx> <out.json>
import docx, json, re, sys
ROMAN = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX","XXI","XXII","XXIII","XXIV","XXV","XXVI"]
d = docx.Document(sys.argv[1])
P = [(p.style.name, p.text.strip()) for p in d.paragraphs]
heads = [i for i, (s, t) in enumerate(P) if s == "Myheadc"]

def title_case(t):
    small = {"of","the","and","in","to","from","after","on","at","its","a"}
    words = t.split()
    return " ".join(w if (i and w.lower() in small) else (w[0].upper() + w[1:]) for i, w in enumerate(words))

chapters = []
for k, h in enumerate(heads):
    head = P[h][1]
    m = re.match(r"Chapter\s+([IVXL]+)\s*\n(.+)", head, re.S)
    if m: n = ROMAN.index(m.group(1)) + 1; title = " ".join(m.group(2).split())
    elif head.startswith("Epilogue"): n = 27; title = "Epilogue"
    else: continue
    end = heads[k + 1] if k + 1 < len(heads) else len(P)
    paras, last_style, skip_caption = [], None, False
    for s, t in P[h + 1:end]:
        if not t: continue
        if s == "Hidden": skip_caption = True; continue
        if s == "Myheadc": continue
        cont = s in ("Textcts", "Quotects", "Bullet text cont", "Bullet2 ct")
        if s == "Normal":
            # photo captions and lists in "Normal" style are skipped; a lowercase run-on line continues the text
            if skip_caption or not (t[0].islower() and len(t) > 80): skip_caption = False; continue
            cont = True
        skip_caption = False
        if cont and paras:
            prev = paras[-1]
            if prev.endswith("-") and t[:1].islower(): paras[-1] = prev[:-1] + t
            else: paras[-1] = prev + " " + t
        else:
            paras.append(t)
    paras = [re.sub(r"\s{2,}", " ", re.sub(r"\t", " ", p)).strip() for p in paras]
    paras = [p for p in paras if p and p != "[Photograph]"]
    chapters.append({"n": n, "title": title_case(title.replace("(continued)", "(Continued)")) if n < 27 else title, "paras": paras})

out = []
for ch in chapters:
    parts, cur, size = [], [], 0
    for p in ch["paras"]:
        if cur and size + len(p) > 4200 and size >= 1800:
            parts.append(cur); cur, size = [], 0
        cur.append(p); size += len(p)
    if cur:
        if parts and size < 1200: parts[-1] += cur
        else: parts.append(cur)
    url = f"https://reference.bahai.org/en/t/nz/DB/db-{19 + ch['n']}.html"
    for i, ps in enumerate(parts):
        out.append({"id": f"dawn-breakers-{ch['n']:02d}-{i + 1:02d}", "book": "The Dawn-Breakers", "chapter": ch["n"],
                    "chapterTitle": ch["title"], "part": i + 1, "parts": len(parts), "text": "\n".join(ps), "url": url})
json.dump(out, open(sys.argv[2], "w"), ensure_ascii=False)
print(len(chapters), "chapters,", len(out), "parts,", sum(len(x["text"]) for x in out), "chars", file=sys.stderr)
for ch in chapters: print(f"  {ch['n']:2} {ch['title'][:55]:55} {len(ch['paras'])} paras", file=sys.stderr)
