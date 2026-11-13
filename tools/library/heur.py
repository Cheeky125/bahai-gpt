"""Clean-up rules for passages with no official digital text (parts of the 1986-2001 volume)."""
import re
GARBLE = {"¤": "ḍ", "Þ": "Ḥ", "¥": "ḥ", "¦": "ṣ", "µ": "ẓ", "ß": "Ṣ", "þ": "ḥ", "¬": "ṭ"}
MARGIN = re.compile(r"(?<=[a-zà-ÿāīūḥḍṭẓṣ,;:’”)\-–]) (\d{1,3})\. (?=[a-zà-ÿ‘“(])")
HYPH = re.compile(r"(\w)- (\w)")
def fix(t):
    t2 = "".join(GARBLE.get(c, c) for c in t)
    t2 = MARGIN.sub(" ", t2).replace("  ", " ")
    return t2
