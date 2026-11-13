"""Phoenix — Phase 2: embed every paragraph with Voyage AI and load it into Supabase.

Run it with 3_load.bat (or: python load_to_supabase.py). It reads your keys from phoenix_keys.txt.
Safe to stop and re-run at any time: it remembers which paragraphs are already loaded.
"""
import json, os, sys, time, zipfile
from pathlib import Path

try:
    import requests
except ImportError:
    sys.exit("The 'requests' package is missing. Run 2_install.bat first.")

ROOT = Path(__file__).resolve().parent.parent          # ...\Documents\Phoenix
KEYS_FILE = ROOT / "phoenix_keys.txt"
DATA_ZIP = ROOT / "data" / "paragraphs-jsonl.zip"
DONE_FILE = ROOT / "data" / "loaded_ids.txt"
MODEL = "voyage-4"
DIMS = 1024
BATCH = int(os.environ.get("PHOENIX_BATCH", "64"))


def read_keys():
    if not KEYS_FILE.exists():
        sys.exit(f"Can't find {KEYS_FILE}. Fill in phoenix_keys.txt first (see the instructions).")
    keys = {}
    for line in KEYS_FILE.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1)
            keys[k.strip()] = v.strip().strip('"').strip("'")
    missing = [k for k in ("SUPABASE_URL", "SUPABASE_SECRET_KEY", "VOYAGE_API_KEY") if not keys.get(k) or "paste" in keys[k].lower()]
    if missing:
        sys.exit("These keys are still empty in phoenix_keys.txt: " + ", ".join(missing))
    keys["SUPABASE_URL"] = keys["SUPABASE_URL"].rstrip("/")
    return keys


def load_paragraphs():
    with zipfile.ZipFile(DATA_ZIP) as z:
        with z.open("paragraphs.jsonl") as f:
            return [json.loads(line) for line in f.read().decode("utf-8").splitlines() if line.strip()]


def embed_input(r):
    """What the embedding model sees: a little context, then the passage."""
    head = " — ".join(x for x in [r.get("author"), r.get("book"), r.get("section")] if x)
    return f"{head}\n{r['text']}"


def voyage_embed(texts, key):
    wait = 20
    for attempt in range(12):
        resp = requests.post("https://api.voyageai.com/v1/embeddings",
                             headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                             json={"input": texts, "model": MODEL, "input_type": "document",
                                   "output_dimension": DIMS, "truncation": True},
                             timeout=120)
        if resp.status_code == 200:
            data = resp.json()
            return [d["embedding"] for d in sorted(data["data"], key=lambda d: d["index"])], data.get("usage", {}).get("total_tokens", 0)
        if resp.status_code in (429, 500, 502, 503, 504):
            print(f"   Voyage says slow down ({resp.status_code}); waiting {wait}s …")
            time.sleep(wait)
            wait = min(wait * 2, 120)
            continue
        sys.exit(f"Voyage error {resp.status_code}: {resp.text[:400]}")
    sys.exit("Voyage kept refusing requests. If you haven't, add a payment method in the Voyage dashboard "
             "(your free 200 million tokens still apply), then run this again.")


def supabase_headers(secret):
    h = {"apikey": secret, "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates,return=minimal"}
    if secret.startswith("eyJ"):                       # older 'service_role' style key
        h["Authorization"] = f"Bearer {secret}"
    return h


def to_row(r, emb):
    return {
        "id": r["id"], "book": r["book"], "book_slug": r["book_slug"], "author": r.get("author"),
        "kind": r.get("kind"), "section": r.get("section"), "subheading": r.get("subheading"),
        "para": r.get("para"), "citation": r.get("citation"), "on_behalf": bool(r.get("on_behalf")),
        "editorial": bool(r.get("editorial")), "url": r.get("url"), "message_date": r.get("date"),
        "text": r["text"], "embedding": "[" + ",".join(f"{x:.6f}" for x in emb) + "]",
    }


def supabase_upsert(rows, keys):
    url = f"{keys['SUPABASE_URL']}/rest/v1/passages?on_conflict=id"
    for attempt in range(6):
        resp = requests.post(url, headers=supabase_headers(keys["SUPABASE_SECRET_KEY"]), data=json.dumps(rows), timeout=120)
        if resp.status_code in (200, 201, 204):
            return
        if resp.status_code in (401, 403):
            sys.exit("Supabase refused the key (401/403). Check SUPABASE_SECRET_KEY is the *secret* key, not the publishable one.")
        if resp.status_code == 404:
            sys.exit("Supabase can't find the 'passages' table. Run 1_create_tables.sql in the SQL Editor first.")
        print(f"   Supabase error {resp.status_code}: {resp.text[:200]} — retrying …")
        time.sleep(5 * (attempt + 1))
    sys.exit("Supabase kept failing. Check your project is running, then run this again.")


def keep_awake():
    """Ask Windows not to sleep while this window is running (no settings are changed)."""
    try:
        import ctypes
        ctypes.windll.kernel32.SetThreadExecutionState(0x80000000 | 0x00000001)  # ES_CONTINUOUS | ES_SYSTEM_REQUIRED
        print("(Keeping the computer awake while loading. The screen may still turn off; that's fine.)\n")
    except Exception:
        pass


def main():
    keep_awake()
    keys = read_keys()
    paras = load_paragraphs()
    done = set(DONE_FILE.read_text().split()) if DONE_FILE.exists() else set()
    todo = [r for r in paras if r["id"] not in done]
    print(f"Phoenix loader — {len(paras):,} paragraphs, {len(done):,} already loaded, {len(todo):,} to go.\n")
    if not todo:
        print("Everything is already loaded. You can run 4_try_search.bat now.")
        return
    tokens, start = 0, time.time()
    with open(DONE_FILE, "a") as log:
        for i in range(0, len(todo), BATCH):
            batch = todo[i:i + BATCH]
            embs, used = voyage_embed([embed_input(r) for r in batch], keys["VOYAGE_API_KEY"])
            supabase_upsert([to_row(r, e) for r, e in zip(batch, embs)], keys)
            log.write("\n".join(r["id"] for r in batch) + "\n")
            log.flush()
            tokens += used
            n = i + len(batch)
            rate = n / max(time.time() - start, 1)
            left = (len(todo) - n) / rate / 60
            print(f"  {len(done) + n:6,}/{len(paras):,} loaded   ({tokens:,} tokens used, about {left:.0f} min left)")
    print("\nDone! All paragraphs are in Supabase. Run 4_try_search.bat to test a search.")


if __name__ == "__main__":
    main()
