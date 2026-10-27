# Find library lines that aren't real passages (contents pages, name lists, salutations, bare reference
# lines, timelines) so search can skip them. Writes app/lib/hidden.json (ids only).
import json, re, sys
rows = [json.loads(l) for l in open(sys.argv[1])]
def listy(t):
    words = re.findall(r"[A-Za-zÀ-ɏ’‘'\-]+", t)
    if len(words) < 5: return False
    if sum(1 for w in words if w.isupper() and len(w) > 1) / len(words) > 0.5: return False  # cables in capitals are real
    caps = sum(1 for w in words if w[0].isupper())
    return caps / len(words) > 0.55 and len(re.findall(r"[.!?;]", t)) <= max(1, len(words) / 30)
def isjunk(r):
    t = r["text"]
    if r.get("editorial") or re.search(r"\b(Thou|Thy|Thee|Thine)\b", t): return False
    front = int(re.search(r"(\d+)$", r["id"]).group(1)) <= 15
    secondary = r["kind"] in ("messages", "compilation") or r["author"] in ("Shoghi Effendi", None)
    if re.match(r"^\(.*\)$", t.strip()) and len(t) < 200: return True
    if re.match(r"^(To the |Dear |Dearly |Beloved |Dearest |Fellow)", t) and len(t) < 220 and t.count(".") <= 1: return secondary
    return listy(t) and (front or secondary)
json.dump(sorted(r["id"] for r in rows if isjunk(r)), open(sys.argv[2], "w"))
