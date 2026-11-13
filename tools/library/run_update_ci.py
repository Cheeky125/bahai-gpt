"""Runs update_library.py on GitHub's machines, with the keys from the repository's Actions secrets
(SUPABASE_URL, SUPABASE_SECRET_KEY, VOYAGE_API_KEY) instead of phoenix_keys.txt."""
import os, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import load_to_supabase as L
def read_keys():
    keys = {k: os.environ.get(k, "").strip() for k in ("SUPABASE_URL", "SUPABASE_SECRET_KEY", "VOYAGE_API_KEY")}
    missing = [k for k, v in keys.items() if not v]
    if missing: sys.exit("Missing GitHub secrets: " + ", ".join(missing))
    keys["SUPABASE_URL"] = keys["SUPABASE_URL"].rstrip("/")
    return keys
L.read_keys = read_keys
L.keep_awake = lambda: None
L.ROOT = HERE
import update_library as U
U.read_keys = read_keys
U.ZIP = HERE / "data" / "library-update.zip"
U.DONE = HERE / "data" / "update_done.txt"
U.main()
