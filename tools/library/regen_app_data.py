"""Regenerate the app's data files that point at library passages (Ruhi, prayers, stories, songs, hidden, daily)."""
import json, collections, sys
S = "/tmp/claude-0/-home-claude/27fce66e-88c8-510e-b21d-11c72eeb6edf/scratchpad"; APP = "/home/claude/bahai-gpt/app/lib"
idmap = json.load(open(S + "/lib/build/id_map.json"))
new = {json.loads(l)["id"]: json.loads(l) for l in open(S + "/lib/build/paragraphs.jsonl")}
old = {json.loads(l)["id"]: json.loads(l) for l in open("/home/claude/phoenix/paragraphs.jsonl")}
M = lambda i: idmap.get(i, i)
def dedupe(ids):
    out = []
    for i in ids:
        if M(i) not in out: out.append(M(i))
    return out
newly_hidden = lambda i: new[i]["editorial"] and not old.get(i, {}).get("editorial")
rep = collections.Counter()
a = json.load(open(f"{APP}/ruhi.json")); b = json.load(open(S + "/p6/ruhi_raw.json")); b["sections"] = a["sections"]
open(S + "/p6/ruhi.json", "w").write(json.dumps(b, ensure_ascii=False, separators=(",", ":")))
for f in ["prayers", "stories"]:
    P = json.load(open(f"{APP}/{f}.json"))
    for x in P:
        sep = next((s for s in ["\n", "\n\n", " "] if x["text"] == s.join(old[i]["text"] for i in x["ids"])), None)
        ids = [i for i in dedupe(x["ids"]) if not newly_hidden(i)]
        if sep is None:
            t = x["text"]
            for i in x["ids"]:
                if newly_hidden(M(i)) and t.endswith("\n" + old[i]["text"]): t = t[: -len(old[i]["text"]) - 1]; rep[f + ": footer cut"] += 1
            x["text"] = t; x["ids"] = ids; rep[f + ": kept (hand-edited)"] += 1; continue
        nt = sep.join(new[i]["text"] for i in ids)
        if nt != x["text"]: rep[f + ": text updated"] += 1
        x["ids"] = ids; x["text"] = nt
        if f == "prayers" and x["id"] not in ids: x["id"] = ids[0]
    open(S + f"/p6/{f}.json", "w").write(json.dumps(P, ensure_ascii=False))
for f in ["hidden", "daily"]:
    L = json.load(open(f"{APP}/{f}.json")); open(S + f"/p6/{f}.json", "w").write(json.dumps(dedupe(L), ensure_ascii=False))
songs = open(f"{APP}/songs.json").read()
for k, v in idmap.items(): songs = songs.replace(f'"{k}"', f'"{v}"')
open(S + "/p6/songs.json", "w").write(songs)
print(dict(rep))
