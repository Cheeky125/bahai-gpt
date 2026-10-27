# Rebuild whole prayers from the Bahá'í Prayers book.
# Our paragraphs (paragraphs.jsonl) are clean but split each prayer into paragraphs.
# The PDF marks the end of each prayer with a right-aligned attribution line ("—Bahá’u’lláh").
# We find those, match them to the paragraph that ends there, and group paragraphs into prayers.
import json, re, subprocess, sys, unicodedata

PDF = "/home/claude/phoenix/books/bahai-prayers.pdf"
OUT = sys.argv[1] if len(sys.argv) > 1 else "prayers.json"

def norm(s):
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z]+", "", s.lower())

txt = subprocess.run(["pdftotext", "-layout", PDF, "-"], capture_output=True, text=True).stdout
lines = txt.split("\n")
start = next(i for i, l in enumerate(lines) if l.strip() == "***")
ends = []   # (normalized tail text before attribution, author)
for i in range(start, len(lines)):
    m = re.match(r"^\s{15,}—\s*(.+?)\s*$", lines[i])
    if not m:
        continue
    who = m.group(1)
    # gather the ~3 previous non-empty lines as the tail
    tail, j = [], i - 1
    while j > start and len(tail) < 2:
        if lines[j].strip():
            tail.insert(0, lines[j].strip())
        j -= 1
    ends.append((norm(" ".join(tail))[-40:], who))

rows = [json.loads(l) for l in open("/home/claude/phoenix/paragraphs.jsonl")]
rows = [r for r in rows if r["book"] == "Bahá’í Prayers"]

AUTH = {"Bahá’u’lláh": "Bahá’u’lláh", "The Báb": "The Báb", "‘Abdu’l‑Bahá": "‘Abdu’l-Bahá", "‘Abdu’l-Bahá": "‘Abdu’l-Bahá"}

# walk paragraphs, matching each end marker in order
end_at = {}
k = 0
for e_tail, who in ends:
    tail = e_tail[-25:]
    for idx in range(k, len(rows)):
        if norm(rows[idx]["text"]).endswith(tail):
            end_at[idx] = who
            k = idx + 1
            break
print("end markers:", len(ends), "matched:", len(end_at), file=sys.stderr)

def theme_of(section):
    s = section.split(" — ")[0].strip()
    if s.startswith("General Prayers"): s = section.split(" — ")[1]
    if s.startswith("Occasional Prayers"): s = section.split(" — ")[1]
    if s.startswith("Special Tablets"): s = section.split(" — ")[1]
    if s.startswith("Teaching"): s = "Teaching"
    if s.startswith("PRAYERS FOR TEACHING") or s.startswith("REVEALED TO THE BAHÁ"): s = "Teaching"
    if s.startswith("The Departed") or "DEPARTED" in s: s = "The Departed"
    if s.startswith("“We will all"): s = "Marriage"
    if s in ("Short Obligatory Prayer", "Medium Obligatory Prayer", "Long Obligatory Prayer"): pass
    return s if not s.isupper() else s.title()

prayers, cur = [], []
for idx, r in enumerate(rows):
    if cur and r["section"] != cur[-1]["section"] and theme_of(r["section"]) != theme_of(cur[-1]["section"]):
        cur = []  # unattributed leftovers across a theme change are dropped (headings / notes)
    cur.append(r)
    if idx in end_at:
        who = end_at[idx]
        if who in AUTH:
            sub = cur[0]["section"].split(" — ")
            prayers.append({
                "id": cur[0]["id"],
                "ids": [x["id"] for x in cur],
                "theme": theme_of(cur[0]["section"]),
                "sub": cur[0]["section"],
                "author": AUTH[who],
                "text": "\n".join(x["text"] for x in cur),
                "url": cur[0]["url"],
            })
        cur = []

json.dump(prayers, open(OUT, "w"), ensure_ascii=False)
from collections import Counter
print(len(prayers), "prayers", file=sys.stderr)
for t, n in Counter(p["theme"] for p in prayers).items(): print(f"  {n:3} {t}", file=sys.stderr)
