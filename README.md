# Workspace model routing (local preview)

Browser-only UI for exploring model directory, pairwise choices, and a structured Gemini-oriented agent rubric. **No calls to model providers**—data stays in `localStorage` / `sessionStorage` until you export JSON.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview   # optional: serve dist/
```

## Export analysis

After recording sessions, download JSON from the app, then:

```bash
node scripts/summarize-sessions.mjs path/to/export.jsonl
```

## License

MIT
