# Rebuilding Phoenix's library from the official texts

Phoenix's passages were first cut from bahai.org PDFs, which left page numbers, broken letters and split
sentences in the text. In November 2026 the library was rebuilt from bahai.org's own digital editions
(XHTML for the books and messages, Word for two message volumes). These scripts did it.

1. Download the official files (they are not kept in this public repository):
   for each book, the `.xhtml` link on its bahai.org Reference Library page (`.docx` where there is no XHTML),
   and for the 1986–2001 messages, each message's `.xhtml`. Put books in `lib/raw`, those messages in `lib/msgs`.
2. `python3 build_library.py <old paragraphs.jsonl> lib/raw lib/msgs lib/build`
   lines every current passage up with the official text and keeps its id. Writes the new `paragraphs.jsonl`,
   `id_map.json` (passages merged into a neighbour) and `build_report.json`.
3. `python3 ../../scripts/build_ruhi_excerpts.py <private Ruhi text folder> lib/build/paragraphs.jsonl ruhi_raw.json`
   then `regen_app_data.py` to rebuild `app/lib/ruhi.json`, `prayers.json`, `stories.json`, `songs.json`, `hidden.json`.
4. The database is updated on Terell's computer with `update_library.py` (phase2 folder, `5_update_library.bat`),
   which reads the keys from `phoenix_keys.txt`. Deploy the app data **after** the database update:
   Ruhi excerpts are character positions in the database text.

Passages with no official digital text (about a third of the 1986–2001 volume) were cleaned with the rules in `heur.py`
(stray page numbers, garbled letters), which were tested against the passages that do have official text.

## Running it without Terell's computer (GitHub)

The repository's Actions secrets hold `SUPABASE_URL`, `SUPABASE_SECRET_KEY` and `VOYAGE_API_KEY`.
- **Database update:** on a branch named `library-update-run`, put the update package at
  `tools/library/data/library-update.zip` and change `tools/library/run_now.txt`; the
  `library-update` workflow runs `run_update_ci.py`. Delete the branch afterwards (the package holds the full text).
- **Story and song vectors:** after `stories.json`, `dawnbreakers.json` or `songs.json` change, change
  `tools/embed_now.txt` on that branch; the `embed-docs` workflow rewrites `app/lib/doc_vectors.json`.
  Until it's refreshed, the site still works: it notices the vectors are stale and embeds the texts itself.
