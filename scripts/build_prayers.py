# Build whole prayers for Phoenix from four prayer books.
#  - Bahá'í Prayers + the two Additional Prayers books: the PDF ends every prayer with a right-aligned
#    attribution line ("—Bahá’u’lláh"); we match each one to the paragraph that ends there.
#  - Prayers and Meditations by Bahá'u'lláh: each numbered section is one prayer.
# Output: app/lib/prayers.json  [{id, ids, group, theme, sub, author, text, url}]
import json, re, subprocess, sys, unicodedata
from collections import Counter

ROOT = "/home/claude/phoenix"
OUT = sys.argv[1]

def norm(s):
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z]+", "", s.lower())

def clean(t):
    t = "\n".join(l for l in t.split("\n") if not re.search(r"↩\s*$", l))   # drop endnote lines ("1 Qur’án 21:89. ↩")
    return re.sub(r"(\w)- (?=[A-Za-z])", r"\1-", t)

AUTH = {"Bahá’u’lláh": "Bahá’u’lláh", "The Báb": "The Báb", "‘Abdu’l‑Bahá": "‘Abdu’l-Bahá", "‘Abdu’l-Bahá": "‘Abdu’l-Bahá"}
rows_all = [json.loads(l) for l in open(f"{ROOT}/paragraphs.jsonl")]

def by_attribution(pdf, book, theme_of):
    txt = subprocess.run(["pdftotext", "-layout", f"{ROOT}/books/{pdf}", "-"], capture_output=True, text=True).stdout
    lines = txt.split("\n")
    star = [i for i, l in enumerate(lines) if l.strip() == "***"]
    start = star[0] if (star and book == "Bahá’í Prayers") else 0
    ends = []
    for i in range(start, len(lines)):
        m = re.match(r"^\s{15,}—\s*(.+?)\s*$", lines[i])
        if not m: continue
        tail, j = [], i - 1
        while j > start and len(tail) < 2:
            if lines[j].strip(): tail.insert(0, lines[j].strip())
            j -= 1
        ends.append((norm(" ".join(tail))[-25:], m.group(1)))
    rows = [r for r in rows_all if r["book"] == book]
    end_at, k = {}, 0
    for tail, who in ends:
        for idx in range(k, len(rows)):
            joined = norm((rows[idx - 1]["text"] if idx else "") + rows[idx]["text"])
            if joined.endswith(tail):
                end_at[idx] = who; k = idx + 1; break
    print(f"{book}: {len(ends)} endings, {len(end_at)} matched", file=sys.stderr)
    out, cur = [], []
    for idx, r in enumerate(rows):
        if cur and theme_of(r["section"]) != theme_of(cur[-1]["section"]): cur = []
        cur.append(r)
        if idx in end_at:
            if end_at[idx] in AUTH:
                out.append({"rows": cur, "author": AUTH[end_at[idx]], "section": cur[0]["section"]})
            cur = []
    if cur and book != "Bahá’í Prayers" and ends and ends[-1][1] in AUTH:
        # the last prayer's ending didn't match (e.g. a poem laid out line by line) — keep it
        out.append({"rows": cur, "author": AUTH[ends[-1][1]], "section": cur[0]["section"]})
    return out

# ---- Bahá'í Prayers (themes from the book) ----
def bp_theme(section):
    s = section.split(" — ")[0].strip()
    parts = section.split(" — ")
    if s in ("General Prayers", "Occasional Prayers", "Special Tablets") and len(parts) > 1: s = parts[1]
    if s.startswith("Teaching") or s.startswith("PRAYERS FOR TEACHING") or s.startswith("REVEALED TO THE BAHÁ"): s = "Teaching"
    if s.startswith("The Departed") or "DEPARTED" in s: s = "The Departed"
    if s.startswith("“We will all"): s = "Marriage"
    return s if not s.isupper() else s.title()

PARENT = {"Infants": "Children", "Midnight": "Evening", "Parents": "Families", "Husbands": "Families", "The Nineteen Day Feast": "Gatherings",
          "For Infants": "Healing", "The Long Healing Prayer": "Healing", "Expectant Mothers": "Women",
          "Short Obligatory Prayer": "Obligatory Prayers", "Medium Obligatory Prayer": "Obligatory Prayers", "Long Obligatory Prayer": "Obligatory Prayers"}
OCCASIONAL = {"The Fast", "Ḥuqúqu’lláh: The Right of God", "Intercalary Days", "Martyrs and Their Families", "Naw-Rúz", "Spiritual Assembly"}
SPECIAL = {"Tablet of Aḥmad", "Fire Tablet", "Tablet of the Holy Mariner", "Tablets of Visitation"}

prayers = []
prev = None
for p in by_attribution("bahai-prayers.pdf", "Bahá’í Prayers", bp_theme):
    t0 = bp_theme(p["section"]); t, sub = t0, None
    if t0 == "For Women": t, sub = ("The Departed" if prev == "The Departed" else "Healing"), "For Women"
    elif t0 in PARENT: t, sub = PARENT[t0], t0
    if t0 == "The Departed" and "PRAYER FOR THE DEAD" in p["section"]: sub = "Prayer for the Dead"
    if t0 != "For Women": prev = t0
    group = "Obligatory Prayers" if t == "Obligatory Prayers" else "Occasional Prayers" if t in OCCASIONAL else "Special Tablets" if t in SPECIAL else "General Prayers"
    prayers.append({"book": "Bahá’í Prayers", "group": group, "theme": t, "sub": sub, "author": p["author"], "rows": p["rows"]})

# ---- Additional Prayers books (no themes; one collection each) ----
for pdf, book, coll in [("additional-prayers-revealed-bahaullah.pdf", "Additional Prayers Revealed by Bahá’u’lláh", "Additional Prayers by Bahá’u’lláh"),
                        ("additional-prayers-revealed-abdul-baha.pdf", "Additional Prayers Revealed by ‘Abdu’l‑Bahá", "Additional Prayers by ‘Abdu’l-Bahá")]:
    for p in by_attribution(pdf, book, lambda s: "x"):
        prayers.append({"book": book, "group": "More Prayer Books", "theme": coll, "sub": None, "author": p["author"], "rows": p["rows"]})

# ---- Prayers and Meditations: one prayer per numbered section ----
book = "Prayers and Meditations by Bahá’u’lláh"
secs = {}
for r in rows_all:
    if r["book"] == book: secs.setdefault(r["section"], []).append(r)
for s, rs in secs.items():
    prayers.append({"book": book, "group": "More Prayer Books", "theme": "Prayers and Meditations by Bahá’u’lláh", "sub": None, "author": "Bahá’u’lláh", "rows": rs, "number": s})

out = []
for p in prayers:
    rs = p.pop("rows")
    p.update({"id": rs[0]["id"], "ids": [x["id"] for x in rs], "text": clean("\n".join(x["text"] for x in rs)), "url": rs[0]["url"]})
    out.append(p)
json.dump(out, open(OUT, "w"), ensure_ascii=False)
print(len(out), "prayers", file=sys.stderr)
for k, n in Counter(p["theme"] for p in out if p["group"] == "More Prayer Books").items(): print(" ", n, k, file=sys.stderr)

# ---- themes for the extra prayer books (computed once by meaning; see scripts/prayer_themes.json) ----
import os
tp = os.path.join(os.path.dirname(__file__), "prayer_themes.json")
if os.path.exists(tp):
    m = json.load(open(tp))
    P = json.load(open(OUT))
    for p in P:
        v = m.get(p["id"])
        if v == "D": p["dup"] = True
        elif v and not (v == "Women" and p["author"] == "Bahá’u’lláh"): p["alsoTheme"] = v
    json.dump(P, open(OUT, "w"), ensure_ascii=False)
