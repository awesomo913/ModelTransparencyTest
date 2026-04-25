# Running the workspace routing UI in Chrome

This folder is a normal Vite + React front end. Nothing here calls external model APIs.

1. Install once: `npm install`
2. Start the dev server: `npm run dev`
3. Open the URL Vite prints (typically `http://localhost:5173`) in Chrome.

The page is a static policy/directory preview: model names are for selection and export only. There is also a **Gemini agent** tab with multi-scenario rubric definitions (still no live API). State is kept in the browser’s `localStorage` until you use Export.

The in-app button **How this runs locally** repeats the same points for anyone sharing a screen or pasting context into another tool.
