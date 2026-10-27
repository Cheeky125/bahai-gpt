# Build a "where does this passage appear in the Ruhi books" index.
# Reads the Ruhi book PDFs (converted to text) privately and records ONLY locations
# (book, unit, section) of passages from Phoenix's own library. No Ruhi text is kept.
import json, re, sys, unicodedata, collections
RUHI = sys.argv[1]   # folder with BK1.txt … BK8.txt (pdftotext -layout)
OUT = sys.argv[2]
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
K = 7  # words per shingle

def words(s):
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    s = re.sub(r"[’‘'`ʼ]", "", s)
    return re.findall(r"[a-z]+", s)

# ---- book text → word stream tagged with (unit, section) ----
locs = []          # per word: (book, unit, section)
stream = []
for b in range(1, 9):
    lines = open(f"{RUHI}/BK{b}.txt", encoding="utf-8").read().split("\n")
    unit, sec, carry = 0, 0, ""
    for ln in lines:
        m = re.match(r"^\s*SECTION (\d+)\s*$", ln)
        if m:
            n = int(m.group(1))
            if n == 1: unit += 1
            sec = n; continue
        if unit == 0 or re.match(r"^\s*\d+\s*$", ln): continue   # before Unit 1, or page numbers
        t = ln.strip()
        if carry: t = carry + t; carry = ""
        if t.endswith("-") and len(t) > 1 and t[-2].isalpha(): carry = t[:-1]; continue
        for w in words(t):
            stream.append(w); locs.append((b, unit, sec))
print(len(stream), "words in books", file=sys.stderr)

index = collections.defaultdict(list)
for i in range(len(stream) - K + 1):
    index[" ".join(stream[i:i + K])].append(i)

# ---- match library passages ----
lib = [json.loads(l) for l in open("/home/claude/phoenix/paragraphs.jsonl", encoding="utf-8")]
libw = [words(r["text"]) for r in lib]
# phrases found in many library passages are stock wording, not a quotation — ignore them
freq = collections.Counter()
for w in libw:
    freq.update(set(" ".join(w[i:i + K]) for i in range(len(w) - K + 1)))
COMMON = 12
found = {}
for r, w in zip(lib, libw):
    if len(w) < K + 3: continue
    runs = collections.defaultdict(int); best = collections.defaultdict(int)
    for i in range(len(w) - K + 1):
        sh = " ".join(w[i:i + K])
        here = set()
        if freq[sh] <= COMMON:
            for pos in index.get(sh, ()):
                here.add(locs[pos])
        for loc in list(runs):
            if loc not in here: runs[loc] = 0
        for loc in here:
            runs[loc] += 1; best[loc] = max(best[loc], runs[loc])
    # an unbroken run of ≥ 6 shingles = at least 12 consecutive words quoted in that section
    places = sorted(k for k, v in best.items() if v >= 6)
    if places:
        found[r["id"]] = [[b, u, s] for b, u, s in places]
json.dump({"units": UNITS, "passages": found}, open(OUT, "w"), ensure_ascii=False)
c = collections.Counter(b for v in found.values() for b, u, s in v)
print(len(found), "library passages located in the Ruhi books; per book:", dict(sorted(c.items())), file=sys.stderr)
