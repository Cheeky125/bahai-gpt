# Phoenix

Search the Bahá’í Writings by theme or question. Every passage is shown word for word, with its exact source and a link to the Bahá’í Reference Library.

Phoenix is an independent study tool, not an official publication of any Bahá’í institution.

## How it works
- `app/api/search/route.js` embeds the question with Voyage AI, then calls the `search_passages` function in Supabase (keyword + meaning search).
- Results are verbatim paragraphs from the database; nothing is generated.

## Settings (Vercel → Project → Settings → Environment Variables)
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `VOYAGE_API_KEY`
- `ANTHROPIC_API_KEY` (optional — smarter search wording + short cited answers to fact questions)
