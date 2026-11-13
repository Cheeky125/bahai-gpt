"""Line up Phoenix's current passages (from the PDFs) with the clean blocks of the official file."""
import json, re, unicodedata, difflib, collections, time, sys
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from xblocks import blocks

def words(t):
    t = unicodedata.normalize("NFD", t)
    t = "".join(c for c in t if not unicodedata.combining(c)).lower()
    return re.findall(r"[a-z0-9]+", t)

def load_old(jsonl, slug):
    rows = [json.loads(l) for l in open(jsonl, encoding="utf-8")]
    return [r for r in rows if r["book_slug"] == slug]

def fast_match(A, B, K=8):
    """Matching runs between word lists A and B: unique K-word anchors (longest increasing chain), difflib only in the gaps."""
    import bisect
    def grams(X):
        d = collections.defaultdict(list)
        for i in range(len(X) - K + 1): d[tuple(X[i:i + K])].append(i)
        return d
    ga, gb = grams(A), grams(B)
    pairs = sorted((v[0], gb[k][0]) for k, v in ga.items() if len(v) == 1 and len(gb.get(k, ())) == 1)
    # longest increasing subsequence on b
    tails, idx, prev = [], [], [-1] * len(pairs)
    for p, (a, b) in enumerate(pairs):
        i = bisect.bisect_left(tails, b)
        if i == len(tails): tails.append(b); idx.append(p)
        else: tails[i] = b; idx[i] = p
        prev[p] = idx[i - 1] if i else -1
    chain, p = [], idx[-1] if idx else -1
    while p != -1: chain.append(pairs[p]); p = prev[p]
    chain.reverse()
    out, la, lb = [], 0, 0
    def gap(a0, a1, b0, b1):
        if a1 > a0 and b1 > b0:
            for a, b, n in difflib.SequenceMatcher(None, A[a0:a1], B[b0:b1], autojunk=False).get_matching_blocks():
                if n: out.append((a0 + a, b0 + b, n))
    for a, b in chain:
        if a < la or b < lb: continue
        gap(la, a, lb, b)
        n = 0
        while a + n < len(A) and b + n < len(B) and A[a + n] == B[b + n]: n += 1
        out.append((a, b, n)); la, lb = a + n, b + n
    gap(la, len(A), lb, len(B))
    return out

def align(old, new):
    """old: list of passages; new: list of blocks. Returns, for each old passage, a Counter {block index: matched words}."""
    ot, oi = [], []
    for i, r in enumerate(old):
        w = words(r["text"]); ot += w; oi += [i] * len(w)
    nt, ni = [], []
    for j, b in enumerate(new):
        w = words(b["text"]); nt += w; ni += [j] * len(w)
    hits = [collections.Counter() for _ in old]
    for a, b, n in fast_match(ot, nt):
        for k in range(n): hits[oi[a + k]][ni[b + k]] += 1
    nlen = collections.Counter(ni); olen = collections.Counter(oi)
    return hits, olen, nlen

if __name__ == "__main__":
    jsonl, slug, xhtml = sys.argv[1:4]
    t = time.time()
    old = load_old(jsonl, slug); new = blocks(xhtml)
    hits, olen, nlen = align(old, new)
    print(f"{slug}: {len(old)} old passages, {len(new)} clean blocks, {time.time()-t:.1f}s")
    cover = [sum(h.values()) / max(1, olen[i]) for i, h in enumerate(hits)]
    print("old passages matched ≥95%:", sum(c >= .95 for c in cover), " 80–95%:", sum(.8 <= c < .95 for c in cover), " <80%:", sum(c < .8 for c in cover))
    used = set(j for h in hits for j in h)
    print("clean blocks not matched to any old passage:", len(new) - len(used))
