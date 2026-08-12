# ask-eval

Test rig for the `/ask` model layer. Runs the page's real matcher and
`leadIsSafe` guard — extracted from `ask.astro` at run time, never copied, so
editing the page edits what gets tested — against a local model served by
LM Studio on `127.0.0.1:1234`.

Regenerate the planner bundle after touching `src/lib` (the bundle is
gitignored, not source):

```bash
npx esbuild src/lib/planner.ts --bundle --format=esm --platform=node \
  --outfile=tools/ask-eval/planner.bundle.mjs
```

| file | what it does |
|---|---|
| `harness.mjs` | loads `match`/`parse`/`leadIsSafe`/`deterministicLead` out of `ask.astro` |
| `fuzz.mjs` | adversarial questions through the full gate; leaks are the only findings that matter |
| `matrix.mjs` | models × prompt strategies × jobs (lead / order / followUps), scored |
| `followups-only.mjs` | the surviving job, measured with its purpose-built prompt |
| `numguard-test.mjs` | reject/accept cases for the number-word guard in `leadIsSafe` |
| `dev-endpoint.mjs` | local `PUBLIC_CHAT_ENDPOINT` returning followUps only — the shape the production Worker route should take |

What the numbers said (Aug 2026, Qwen3.6-35B-A3B and Qwen3-Coder-Next-80B,
both 4-bit local): the models miscount a handed list ~half the time on every
prompt strategy, so the lead stays deterministic; the matcher's own order is
already optimal (0.98 monotonicity) so ordering is not requested; followUps
survive the page's parse filter at ~3 usable per question, which is the page
cap, at under 2s a call. Suggestions are the one job that is structurally safe
— anything `parse()` can't turn into filters is discarded, so the worst a bad
one can be is useless, never wrong.
