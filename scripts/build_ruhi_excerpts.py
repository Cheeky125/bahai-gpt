# Phoenix — exact Ruhi excerpts.
# For every passage of the Writings that a Ruhi book quotes, record EXACTLY which words the book quotes:
# where it starts, where it stops, and where it skips words with "…". Only character positions within
# Phoenix's own library text are stored (plus book/unit/section and order) — never any Ruhi wording.
# Usage: python3 -I build_excerpts.py <folder with BK1.txt … BK8.txt> <paragraphs.jsonl> <out.json>
import json, re, sys, unicodedata, collections
RUHI, LIB, OUT = sys.argv[1:4]
UNITS = {
  1: ["Understanding the Bahá’í Writings", "Prayer", "Life and Death"],
  2: ["The Joy of Teaching", "Uplifting Conversations", "Deepening Themes"],
  3: ["Some Principles of Bahá’í Education", "Lessons for Children’s Classes, Grade 1"],
  4: ["The Greatness of This Day", "The Life of the Báb", "The Life of Bahá’u’lláh"],
  5: ["Life’s Springtime", "An Age of Promise", "Serving as an Animator"],
  6: ["The Spiritual Nature of Teaching", "Qualities and Attitudes Essential for Teaching", "The Act of Teaching"],
  7: ["The Spiritual Dynamics of Advancing on a Path of Service", "Serving as a Tutor of the Institute Courses", "Promoting the Arts at the Grassroots"],
  8: ["The Center of the Covenant and His Will and Testament", "The Guardian of the Faith", "The Universal House of Justice"],
}
STRONG, SEED, SHORT, LOOSE = 12, 4, 7, 20    # ≥12 consecutive words, or ≥5 when the book's quotation marks wrap them exactly
QO, QC, ELL = "\x01qo", "\x01qc", "\x01ell"   # markers in the book stream: “ ” and …

def norm_tok(s):
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    return [spell(w) for w in re.findall(r"[a-z]+", re.sub(r"[’‘'`ʼ]", "", s))]

def spell(w):
    """Fold British/American spellings together (labour/labor, centre/center, realise/realize, travelled/traveled)."""
    w = w.replace("our", "or")
    if len(w) >= 5 and w.endswith("re"): w = w[:-2] + "er"
    return w.replace("oo", "o").replace("iz", "is").replace("ll", "l").replace("dgement", "dgment")

TOKRE = re.compile(r"[^\W\d_](?:[^\W\d_]|[’‘'`ʼ])*", re.U)
def tokens(text):
    out = []
    for m in TOKRE.finditer(text):
        for t in norm_tok(m.group(0)):
            out.append((t, m.start(), m.end()))
    return out

lib = [json.loads(l) for l in open(LIB, encoding="utf-8")]
VOCAB = {w for r in lib for w in norm_tok(r["text"])}

# ---- book word stream with (book, unit, section) ----
stream, locs, starts = [], [], set()   # starts: positions of the first word on a line
for b in range(1, 9):
    unit = sec = 0; carry = ""; refs = False
    for ln in open(f"{RUHI}/BK{b}.txt", encoding="utf-8").read().split("\n"):
        m = re.match(r"^\s*SECTION (\d+)\s*$", ln)
        if m:
            n = int(m.group(1)); unit += (n == 1); sec = n; refs = False; continue
        if re.match(r"^\s*references\s*$", ln, re.I): refs = True   # the unit's list of sources
        if refs: continue
        if unit == 0 or re.match(r"^\s*\d+\s*$", ln): continue
        if re.match(r"^\s*\S.{0,80}\s[–-]\s\d+\s*$", ln) or re.match(r"^\s*\d+\s[–-]\s\S.{0,80}$", ln): continue   # page headers
        t = ln.strip()
        if carry:
            # a word split across lines: "conse-/quent" is one word; "over-/centralization" is two
            first = re.match(r"\S*", t).group(0)
            joined = norm_tok(carry.split()[-1] + first) if carry.split() else []
            t = carry + t if len(joined) == 1 and joined[0] in VOCAB else carry + " " + t
            carry = ""
        if t.endswith("-") and len(t) > 1 and t[-2].isalpha(): carry = t[:-1]; continue
        t = re.sub(r"\.\s?\.\s?\.|…", " \x02 ", t)
        line_first = len(stream)
        for piece in re.split(r"([“”\x02])", t):
            if piece == "“": toks = [QO]
            elif piece == "”": toks = [QC]
            elif piece == "\x02": toks = [ELL]
            else: toks = norm_tok(piece)
            for w in toks:
                stream.append(w); locs.append((b, unit, sec))
        starts.add(line_first)
N = len(stream)
seed_index = collections.defaultdict(list)
for i in range(N - SEED + 1):
    seed_index[tuple(stream[i:i + SEED])].append(i)

def in_quotes(p):
    for j in range(p - 1, max(-1, p - 400), -1):
        if stream[j] == QO: return True
        if stream[j] == QC: return False
    return False
KR = {"writings": 0, "prayers": 0, "talks": 1, "compilation": 2, "messages": 3}

def only_ellipsis(a, b):
    """True if the book words between positions a and b are just an ellipsis (the book skipped words)."""
    gap = stream[a:b]
    return 0 < len(gap) <= 2 and ELL in gap and all(g in (ELL,) for g in gap)

MARKS = (QO, QC, ELL)
def small_gap(l1, l2, b1, b2):
    """A few words differ (a spelling or translation variant) but the quote carries on: bridge it."""
    return 0 <= l2 - l1 <= 3 and 0 <= b2 - b1 <= 3 and (l2 - l1) + (b2 - b1) > 0 and not any(t in MARKS for t in stream[b1:b2])

def continues(l1, l2, b1, b2):
    """The book carries straight on while the library has words in between (e.g. 'he said,'): the book skipped them."""
    return b1 == b2 and 0 < l2 - l1 <= 60

def interrupted(l1, l2, b1, b2):
    """The book breaks into the quote with its own words (“…,” the Báb told the official, “…”); the library doesn't."""
    g = stream[b1:b2]
    if not (l1 == l2 and 2 < len(g) <= 14 and QC in g and QO in g): return False
    i, j = g.index(QC), len(g) - 1 - g[::-1].index(QO)
    # needs the book's own words in between; a bare ” “ means two separate quotes
    return i < j and sum(1 for t in g[i + 1:j] if t not in MARKS) >= 2

def runs_for(w):
    """All maximal runs where passage words w[i..] equal book words stream[p..] (length ≥ SEED)."""
    found, seen_diag = [], set()
    for i in range(len(w) - SEED + 1):
        for p in seed_index.get(tuple(w[i:i + SEED]), ()):
            d = p - i
            if (d, i) in seen_diag: continue
            a, bpos = i, p
            while a > 0 and bpos > 0 and w[a - 1] == stream[bpos - 1]: a -= 1; bpos -= 1
            e, q = i + SEED, p + SEED
            while e < len(w) and q < N and w[e] == stream[q]: e += 1; q += 1
            for k in range(a, e): seen_diag.add((d, k))
            found.append((a, e, bpos, q))   # passage words [a,e) == book words [bpos,q)
    return found

excerpts = []   # (bookpos_start, bookpos_end, passage_id, parts[(a,e)], loc)
for r in lib:
    if r.get("editorial"): continue
    tk = tokens(r["text"]); w = [t for t, _, _ in tk]
    if len(w) < STRONG: continue
    runs = runs_for(w)
    def bounded(x):   # the book's own quotation marks / ellipses sit right at both ends
        return stream[x[2] - 1] in (QO, ELL) and x[3] < N and stream[x[3]] in (QC, ELL)
    # outside the book's quotation marks, only a long run counts (block quotes); short ones are the book's own prose
    strong = [x for x in runs if (x[1] - x[0] >= STRONG and in_quotes(x[2])) or (x[1] - x[0] >= LOOSE and x[2] in starts) or (x[1] - x[0] >= SHORT and bounded(x))]
    if not strong: continue
    runs.sort(key=lambda x: x[2])
    used = set()
    for s in sorted(strong, key=lambda x: x[2]):
        if s in used: continue
        def intr(l1, l2, b1, b2):   # …and the library runs on mid-sentence there (not two separate sentences)
            return interrupted(l1, l2, b1, b2) and 0 < l1 < len(tk) and not re.search(r"[.!?]", r["text"][tk[l1 - 1][2]:tk[l1][1]])
        chain = [s]; used.add(s); joined = set()   # joined: chain links bridged over a small variant (one piece)
        # extend forward across "…" gaps and small variants
        while True:
            last = chain[-1]
            nxt = [x for x in runs if x not in used and x[0] >= last[1] and (only_ellipsis(last[3], x[2]) or small_gap(last[1], x[0], last[3], x[2]) or continues(last[1], x[0], last[3], x[2]) or intr(last[1], x[0], last[3], x[2]))]
            if not nxt: break
            x = min(nxt, key=lambda x: x[2]); chain.append(x); used.add(x)
            if small_gap(last[1], x[0], last[3], x[2]) or intr(last[1], x[0], last[3], x[2]): joined.add(x)
        # and backward
        while True:
            first = chain[0]
            prv = [x for x in runs if x not in used and x[1] <= first[0] and (only_ellipsis(x[3], first[2]) or small_gap(x[1], first[0], x[3], first[2]) or continues(x[1], first[0], x[3], first[2]) or intr(x[1], first[0], x[3], first[2]))]
            if not prv: break
            x = max(prv, key=lambda x: x[3]); chain.insert(0, x); used.add(x)
            if small_gap(x[1], first[0], x[3], first[2]) or intr(x[1], first[0], x[3], first[2]): joined.add(first)
        parts = []
        for x in chain:
            a, e = x[0], x[1]
            cs, ce = tk[a][1], tk[e - 1][2]
            while ce < len(r["text"]) and r["text"][ce] in ".,;:!?”’)»—–":   # keep closing punctuation
                ce += 1
            # parts separated only by spaces/dots in the library text (its own "…") are really one piece
            if parts and (x in joined or cs <= parts[-1][1] or re.fullmatch(r"[\s.…]*", r["text"][parts[-1][1]:cs])): parts[-1][1] = max(parts[-1][1], ce)
            else: parts.append([cs, ce])
        t0 = r["text"][:parts[0][0]]
        own = int(t0.count("“") <= t0.count("”"))   # not words this passage is itself quoting from someone else
        excerpts.append((chain[0][2], chain[-1][3], r["id"], parts, locs[chain[0][2]], KR.get(r["kind"], 9), sum(e - a for a, e, _, _ in chain), own, w))

# ---- one passage per quoted spot: overlapping book spans → keep the best source; drop fragments ----
excerpts.sort(key=lambda x: (x[0], -(x[1] - x[0])))
chosen = []
for ex in excerpts:
    clash = [c for c in chosen if c[4] == ex[4] and not (ex[1] <= c[0] or ex[0] >= c[1])]
    if not clash: chosen.append(ex); continue
    c = clash[0]
    better = (ex[6], ex[7], -ex[5]) > (c[6], c[7], -c[5])
    if better and len(clash) == 1: chosen[chosen.index(c)] = ex
chosen.sort(key=lambda x: x[0])

if len(sys.argv) > 4 and sys.argv[4] == "bounds":
    import random; random.seed(7)
    ok = lambda c: stream[c[0] - 1] in (QO, ELL) and c[1] < N and stream[c[1]] in (QC, ELL)
    bad = [c for c in chosen if in_quotes(c[0]) and not ok(c)]
    print("in quotes but not cleanly bounded:", len(bad), "of", sum(1 for c in chosen if in_quotes(c[0])), file=sys.stderr)
    for c in random.sample(bad, min(20, len(bad))):
        print(c[4], "BOOK:", " ".join(stream[c[0] - 4:c[0]]), "[[", " ".join(stream[c[0]:c[0] + 3]), "...", " ".join(stream[c[1] - 3:c[1]]), "]]", " ".join(stream[c[1]:c[1] + 4]), file=sys.stderr)
if len(sys.argv) > 4 and sys.argv[4] == "diag":
    import random; random.seed(3)
    out = [c for c in chosen if not in_quotes(c[0] + 1)]
    print("not in quotes:", len(out), "of", len(chosen), collections.Counter(c[4][0] for c in out), file=sys.stderr)
    for c in random.sample(out, min(25, len(out))):
        r = next(x for x in lib if x["id"] == c[2]); print(c[4], c[6], "|", " … ".join(r["text"][a:b] for a, b in c[3])[:160], file=sys.stderr)
quotes = collections.defaultdict(list); passages = collections.defaultdict(set)
# a fragment of a quote the unit already gave (fill-in-the-blank exercises, "what does this phrase mean?") is not a new quote
def qwords(c):
    tk = tokens(next_text[c[2]]); return " " + " ".join(t for t, a, e in tk if any(a >= x and e <= y for x, y in c[3])) + " "
next_text = {r["id"]: r["text"] for r in lib}
kept, seen_unit = [], collections.defaultdict(list)
for c in chosen:
    wds = qwords(c); u = c[4][:2]
    if any(wds in prev and len(wds) < len(prev) for prev in seen_unit[u]): continue
    seen_unit[u].append(wds); kept.append(c)
chosen = kept
for bs, be, pid, parts, (b, u, s), *_ in chosen:
    # how the book opens and closes the quote: "q" quotation mark, "e" ellipsis, "-" not clear (no Ruhi words stored)
    mark = lambda t: "q" if t in (QO, QC) else "e" if t == ELL else "-"
    quotes[f"{b}.{u}.{s}"].append({"id": pid, "parts": parts, "m": mark(stream[bs - 1]) + (mark(stream[be]) if be < N else "-")})
    passages[pid].add((b, u, s))
# quotes repeated later in the same section (e.g. in exercises), or bits of a quote already shown, appear once
def inside(q, other):
    return q["id"] == other["id"] and q is not other and all(any(a >= c and b <= d for c, d in other["parts"]) for a, b in q["parts"])
for k, lst in quotes.items():
    out = []
    for q in lst:
        if any(inside(q, o) for o in lst) or any(q["id"] == o["id"] and q["parts"] == o["parts"] for o in out): continue
        out.append(q)
    quotes[k] = out
json.dump({"units": UNITS, "quotes": quotes, "passages": {k: sorted(map(list, v)) for k, v in passages.items()}}, open(OUT, "w"), ensure_ascii=False)
print(len(chosen), "quotes in", len(quotes), "sections;", len(passages), "library passages", file=sys.stderr)
print(collections.Counter(int(k.split(".")[0]) for k, v in quotes.items() for _ in v), file=sys.stderr)
