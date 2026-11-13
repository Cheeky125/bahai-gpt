"""Turn an official bahai.org XHTML file into a flat list of text blocks (paragraphs, headings, list items)."""
import re
from bs4 import BeautifulSoup, NavigableString

def clean_text(el):
    el = BeautifulSoup(str(el), "lxml")
    for x in el.select("sup.af, sup.ye, a.td, a.jc, span.rf"): x.decompose()   # footnote markers, printed numbers, back-links, item numbers
    for br in el.find_all("br"): br.replace_with("\n")
    for w in el.find_all("wbr"): w.replace_with("")
    t = el.get_text("")
    t = t.replace("\u2011", "-").replace("\u2012", "–").replace("\u21a9", "")
    t = re.sub(r"[\u2060\u200e\u200f\u200b\u00ad]", "", t)
    t = re.sub(r"[\u2002\u2003\u2009\u202f]", " ", t)
    t = re.sub(r"[ \t\r\f\v ]+", " ", t)
    t = re.sub(r" *\n *", "\n", t).strip()
    return t

def blocks(path):
    s = BeautifulSoup(open(path, encoding="utf-8").read(), "lxml")
    body = s.body
    out = []
    for el in body.find_all(["h1", "h2", "h3", "h4", "h5", "p", "li"]):
        if el.find_parent("nav") or el.find_parent("div", class_="wf"): continue
        if el.name == "li" and el.find(["p", "li"]): continue
        if el.find_parent("li") and el.name == "p" and False: pass
        cls = el.get("class") or []
        a = el.find("a", class_="sf")
        num = el.find("a", class_="td") or el.find("span", class_="rf")
        foot = [x.get_text(strip=True) for x in el.select("sup.af")]
        text = clean_text(el)
        if not text: continue
        out.append({
            "tag": el.name, "cls": " ".join(cls), "anchor": a.get("id") if a else None,
            "num": num.get_text(strip=True) if num else None, "text": text, "notes": foot,
            "parent": ".".join([el.parent.name] + (el.parent.get("class") or [])),
        })
    return out

if __name__ == "__main__":
    import sys, json
    for b in blocks(sys.argv[1])[: int(sys.argv[2]) if len(sys.argv) > 2 else 40]:
        print(json.dumps(b, ensure_ascii=False)[:260])
