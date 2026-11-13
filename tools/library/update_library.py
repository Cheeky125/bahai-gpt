"""Phoenix — November 2026 library update.
Replaces the damaged passage text with the official text from bahai.org, fixes authors and labels,
adds the Notes to the Kitáb-i-Aqdas, and removes passages that were merged into their neighbours.
Run it with 5_update_library.bat. It reads your keys from phoenix_keys.txt, like the first load did.
Safe to stop and re-run: it remembers what it has already done.
"""
import json, sys, time, zipfile, requests
from pathlib import Path
from load_to_supabase import read_keys, voyage_embed, supabase_headers, supabase_upsert, to_row, embed_input, keep_awake, ROOT, BATCH

ZIP = ROOT / "data" / "library-update.zip"
DONE = ROOT / "data" / "update_2026_11_done.txt"

def rows(name):
    with zipfile.ZipFile(ZIP) as z:
        data = z.read(name).decode("utf-8")
    return json.loads(data) if name.endswith(".json") else [json.loads(l) for l in data.splitlines() if l.strip()]

def remove(ids, keys):
    url = f"{keys['SUPABASE_URL']}/rest/v1/passages"
    h = supabase_headers(keys["SUPABASE_SECRET_KEY"])
    for i in range(0, len(ids), 40):
        chunk = ids[i:i + 40]
        for attempt in range(6):
            r = requests.delete(url, headers=h, params={"id": "in.(" + ",".join(chunk) + ")"}, timeout=120)
            if r.status_code in (200, 204): break
            print(f"   Supabase error {r.status_code}: {r.text[:200]} — retrying …"); time.sleep(5 * (attempt + 1))
        else: sys.exit("Supabase kept failing. Check your project is running, then run this again.")

def main():
    if not ZIP.exists(): sys.exit(f"Can't find {ZIP}. Put library-update.zip in the data folder first.")
    keep_awake()
    keys = read_keys()
    done = set(DONE.read_text().split()) if DONE.exists() else set()
    log = open(DONE, "a")
    gone, details, fresh = rows("remove.json"), rows("details.jsonl"), rows("reembed.jsonl")
    print(f"Phoenix library update — {len(fresh):,} passages with new text, {len(details):,} with corrected details, {len(gone):,} merged away.\n")
    if "step1" not in done:
        print("Step 1 of 3: removing passages that were merged into their neighbours …")
        remove(gone, keys); log.write("step1\n"); log.flush()
    print("Step 2 of 3: correcting authors, labels and links …")
    todo = [r for r in details if r["id"] not in done]
    for i in range(0, len(todo), 200):
        batch = todo[i:i + 200]
        supabase_upsert([{k: v for k, v in to_row(r, []).items() if k != "embedding"} for r in batch], keys)
        log.write("\n".join(r["id"] for r in batch) + "\n"); log.flush()
        print(f"   {min(i + 200, len(todo)):,}/{len(todo):,}")
    print("Step 3 of 3: loading the corrected text (this part takes longest) …")
    todo = [r for r in fresh if "e:" + r["id"] not in done]
    tokens, start = 0, time.time()
    for i in range(0, len(todo), BATCH):
        batch = todo[i:i + BATCH]
        embs, used = voyage_embed([embed_input(r) for r in batch], keys["VOYAGE_API_KEY"])
        supabase_upsert([to_row(r, e) for r, e in zip(batch, embs)], keys)
        log.write("\n".join("e:" + r["id"] for r in batch) + "\n"); log.flush()
        tokens += used; n = i + len(batch); left = (len(todo) - n) / max(n / max(time.time() - start, 1), 0.01) / 60
        print(f"   {n:,}/{len(todo):,}   ({tokens:,} tokens used, about {left:.0f} min left)")
    print("\nDone! The library update is in. You can close this window and tell Claude it finished.")

if __name__ == "__main__":
    main()
