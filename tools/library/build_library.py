"""Build Phoenix's new library file from the official bahai.org texts, keeping every passage id that survives.
Inputs: old paragraphs.jsonl, lib/raw (official books), lib/msgs (1986-2001 messages).
Outputs (in OUT): paragraphs.jsonl, id_map.json (merged id -> surviving id), build_report.json."""
import sys, os, json, re, collections
sys.path.insert(0, os.path.dirname(__file__))
from xblocks import blocks
import dblocks
from align import align, words
from heur import fix as heur_fix
J, R, M, OUT = sys.argv[1:5]
rows = [json.loads(l) for l in open(J, encoding="utf-8")]
by = collections.defaultdict(list)
for r in rows: by[r["book_slug"]].append(r)

UHJ, SE, AB, BU, BAB = "The Universal House of Justice", "Shoghi Effendi", "‘Abdu’l-Bahá", "Bahá’u’lláh", "The Báb"
EDITORIAL_HEADINGS = re.compile(r"^(Notes|Endnotes|Preface|Introduction|Foreword|Author’s Preface.*|Key to Passages.*|Notes on Translations?|Note on the Translation|Glossary|Bibliography|Index)$")
def author_heading(t):
    """'Extracts from Letters Written on Behalf of Shoghi Effendi' -> (author, on_behalf or None if mixed)."""
    if not re.match(r"^(Extracts?|From|Selected)\b", t): return None
    who = UHJ if "Universal House of Justice" in t else SE if "Shoghi Effendi" in t else AB if "‘Abdu’l-Bahá" in t else BU if "Bahá’u’lláh" in t else BAB if "the Báb" in t else None
    if not who: return None
    if re.search(r"by (and|or) on behalf", t, re.I): ob = None
    elif re.search(r"on behalf", t, re.I): ob = True
    else: ob = False
    return who, ob
def is_citation(b): return b["tag"] == "p" and re.search(r"\bmb\b", b["cls"]) is not None

def context(new, compilation):
    """For each block: (h2 heading, author heading result, topic heading)."""
    ctx, h2, ah, topic = [], None, None, None
    for b in new:
        cl = b["cls"].split()
        if b["tag"] in ("h1", "h2"): h2 = b["text"].replace("\n", " "); ah = None
        elif b["tag"] in ("h3", "h4") or (b["tag"] == "p" and "c" in cl and ({"q", "l", "lb", "kc"} & set(cl))):
            if h2 and EDITORIAL_HEADINGS.match(h2): h2 = None   # a new heading inside: the editors' part is over
        if compilation and b["tag"] == "p" and re.search(r"\bc\b", b["cls"]):
            a = author_heading(b["text"])
            if a: ah = a
            elif "lb" not in b["cls"].split(): topic = b["text"]
        ctx.append((h2, ah, topic))
    return ctx

out, idmap, report, new_rows = [], {}, collections.Counter(), []
examples = collections.defaultdict(list)
for slug, old in by.items():
    url0 = old[0].get("url") or ""
    compilation = "/compilations/" in url0
    if slug == "uhj-messages":
        new = []
        for mid in sorted({r["id"][4:16] for r in old}): new += blocks(f"{R}/msg-{mid}.xhtml")
    elif slug == "muhj-1986-2001":
        new = []
        for f in sorted(os.listdir(M)): new += blocks(f"{M}/{f}")
    elif os.path.exists(f"{R}/{slug}.xhtml"): new = blocks(f"{R}/{slug}.xhtml")
    elif os.path.exists(f"{R}/{slug}.docx"): new = dblocks.blocks(f"{R}/{slug}.docx")
    else: new = []
    ctx = context(new, compilation)
    hits, olen, nlen = align(old, new) if new else ([collections.Counter() for _ in old], collections.Counter(), collections.Counter())
    owner = {}
    for j in range(len(new)):
        cand = [(h[j], i) for i, h in enumerate(hits) if j in h]
        if cand and sum(c for c, _ in cand) >= 0.5 * max(1, nlen[j]): owner[j] = max(cand)[1]
    owned = collections.defaultdict(list)
    for j, i in owner.items(): owned[i].append(j)
    for i, r in enumerate(old):
        row = dict(r); cov = sum(hits[i].values()) / max(1, olen[i]); js = sorted(owned.get(i, []))
        if js and cov >= .8:
            row["text"] = " ".join(new[j]["text"].replace("\n", " ") for j in js)   # same look as today: no line breaks inside a passage
            first = new[js[0]]
            if first["anchor"]: row["url"] = "https://www.bahai.org/r/" + first["anchor"]
            if first["num"]:
                row["para"] = first["num"].rstrip("."); row["para_printed"] = True
            h2, ah, topic = ctx[js[0]]
            if h2 and EDITORIAL_HEADINGS.match(h2):
                if not row["editorial"]: report["now marked editors' text"] += 1; examples["editorial"].append(r["id"])
                row["editorial"] = True
            if compilation and ah:
                who, ob = ah
                if row["author"] != who: report["author corrected"] += 1; examples["author"].append(f'{r["id"]}: {r["author"]} -> {who}')
                row["author"] = who
                # the source line under the extract settles "by or on behalf of" headings
                cit = next((new[k]["text"] for k in range(js[-1] + 1, min(len(new), js[-1] + 6)) if is_citation(new[k])), None)
                if cit: row["citation"] = re.sub(r"\s*\[\d+\]\s*$", "", cit).strip().strip("()").strip()
                if ob is None and cit: ob = bool(re.search(r"on behalf", cit, re.I))
                if ob is not None and bool(row["on_behalf"]) != ob:
                    report["on-behalf flag corrected"] += 1; examples["on_behalf"].append(f'{r["id"]}: {row["on_behalf"]} -> {ob}')
                    row["on_behalf"] = ob
                if topic and (not row["section"] or len(row["section"]) < 12 or row["section"].endswith(("…", "...”", "”"))):
                    row["section"] = topic
            if slug == "kitab-i-aqdas" and h2:
                sec = re.sub(r"\s+", " ", h2)
                if sec.startswith("Synopsis"): row["section"] = "Synopsis and Codification"; row["author"] = UHJ; row["editorial"] = True
                elif sec.startswith("A Description"): row["section"] = "A Description of the Kitáb-i-Aqdas"; row["author"] = SE; row["editorial"] = False
                elif sec in ("Preface", "Introduction"): row["section"] = sec; row["author"] = UHJ; row["editorial"] = True
                elif sec.startswith("Questions and Answers"): row["section"] = "Questions and Answers"
                elif sec.startswith("Some Texts"): row["section"] = "Some Texts Supplementary to the Kitáb-i-Aqdas"
            if all(is_citation(new[j]) for j in js) and not row["editorial"]:
                row["editorial"] = True; report["source lines (not text) now hidden"] += 1
            report["text from official source"] += 1
            if words(row["text"]) != words(r["text"]): report["words changed"] += 1
        elif js == [] and cov >= .8 and hits[i]:
            tgt = max(hits[i], key=hits[i].get)
            if tgt in owner: idmap[r["id"]] = old[owner[tgt]]["id"]; report["merged into neighbour"] += 1; continue
            report["fragment, left as it was"] += 1
        else:
            if slug == "muhj-1986-2001" or not new:
                t2 = heur_fix(r["text"])
                if t2 != r["text"]: row["text"] = t2; report["cleaned by rules (no digital source)"] += 1
                else: report["unchanged (no digital source)"] += 1
            else:
                if not row["editorial"]: report["junk (contents lists, tables) now hidden"] += 1
                row["editorial"] = True
        if re.match(r"^(Last modified:|This document has been downloaded)", row["text"]) and not row["editorial"]:
            row["editorial"] = True; report["page footers now hidden"] += 1
        out.append(row)
    # new passages: the Notes to the Kitáb-i-Aqdas (missing until now)
    if slug == "kitab-i-aqdas":
        k0 = next(k for k, b in enumerate(new) if b["tag"] == "h2" and b["text"] == "Notes")
        k1 = next(k for k, b in enumerate(new) if k > k0 and b["tag"] == "h2")
        note = None
        for b in new[k0 + 1:k1]:
            m = re.match(r"^(\d+)\.\s+(.*)$", b["text"], re.S)
            if "ob" in b["cls"].split() and m:
                if note: new_rows.append(note)
                n = int(m.group(1))
                note = {**{k: None for k in old[0]}, "id": f"kitab-i-aqdas-note-{n:03d}", "book": old[0]["book"], "book_slug": slug,
                        "author": UHJ, "kind": "notes", "section": "Notes · " + m.group(2).strip(), "subheading": m.group(2).strip(), "para": str(n),
                        "para_printed": True, "on_behalf": False, "editorial": False, "url": "https://www.bahai.org/r/" + b["anchor"], "text": ""}
            elif note: note["text"] = (note["text"] + " " + b["text"].replace("\n", " ")).strip()
        if note: new_rows.append(note)
        report["new passages: Notes to the Kitáb-i-Aqdas"] += sum(1 for x in new_rows if x["id"].startswith("kitab-i-aqdas-note-"))
# merged ids that point at another merged id -> follow to the end
for k in list(idmap):
    v = idmap[k]
    while v in idmap: v = idmap[v]
    idmap[k] = v
os.makedirs(OUT, exist_ok=True)
with open(f"{OUT}/paragraphs.jsonl", "w", encoding="utf-8") as f:
    for r in out + new_rows: f.write(json.dumps(r, ensure_ascii=False) + "\n")
json.dump(idmap, open(f"{OUT}/id_map.json", "w"), indent=0)
json.dump({"report": dict(report), "examples": {k: v[:40] for k, v in examples.items()}}, open(f"{OUT}/build_report.json", "w"), indent=1, ensure_ascii=False)
print(len(out) + len(new_rows), "passages;", json.dumps(dict(report), ensure_ascii=False, indent=1))
