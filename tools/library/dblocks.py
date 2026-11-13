"""Turn an official bahai.org Word (.docx) file into the same flat list of text blocks as xblocks."""
import re, docx
from docx.oxml.ns import qn
NUM = re.compile(r"^(\d{1,4}\.\d{1,3}[a-z]?)\s+")
def run_text(r):
    rpr = r._r.rPr
    if rpr is not None:
        va = rpr.find(qn("w:vertAlign"))
        if va is not None and va.get(qn("w:val")) == "superscript": return ""
        st = rpr.find(qn("w:rStyle"))
        if st is not None and "ootnote" in (st.get(qn("w:val")) or ""): return ""
    if r._r.find(qn("w:footnoteReference")) is not None or r._r.find(qn("w:endnoteReference")) is not None: return ""
    return "".join((t.text or "") if t.tag == qn("w:t") else ("\t" if t.tag == qn("w:tab") else ("\n" if t.tag == qn("w:br") else "")) for t in r._r)
def blocks(path):
    out = []
    for p in docx.Document(path).paragraphs:
        t = "".join(run_text(r) for r in p.runs)
        t = t.replace("‑", "-").replace("‒", "–")
        t = re.sub(r"[⁠‎‏​­]", "", t)
        t = re.sub(r"[ \t     ]+", " ", t)
        t = re.sub(r" *\n *", "\n", t).strip()
        if not t: continue
        m = NUM.match(t); num = None
        if m: num = m.group(1); t = t[m.end():].strip()
        out.append({"tag": "p", "cls": p.style.name, "anchor": None, "num": num, "text": t, "notes": [], "parent": ""})
    return out
if __name__ == "__main__":
    import sys, json
    b = blocks(sys.argv[1]); print(len(b))
    for x in b[int(sys.argv[2]):int(sys.argv[2]) + 12]: print(json.dumps(x, ensure_ascii=False)[:220])
