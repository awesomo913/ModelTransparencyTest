# ModelTransparencyTester

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Vite](https://img.shields.io/badge/stack-Vite%20%2B%20React-646cff)](https://vitejs.dev/)

**ModelTransparencyTester** is a small, **local-only** web app for studying **how people choose and compare AI coding models** when the choice is not handed to them on a plate.

There are **no sign-ins and no calls to model providers**—only a realistic-looking task surface, a large mixed catalog of model names, structured logging, and **JSON export** so you can analyze choices offline (including in blind setups, e.g. with browser extensions that sit beside the page).

---

## Why this exists

- **Model transparency** is partly a UX question: when dozens of “GPT / Claude / Gemini / …” labels appear together, *what* do users pick, *how* do they search, and *how long* does it take? This tool records **primary / backup** picks, **search text**, list order, and **timings** without touching any API.
- **Blind and informed runs**: The default “PR review” flow does **not** pre-select a model, so the first click is not skewed. You can still use **Options → Append demo events** to generate a full example log for a dry run.
- **Interleaved lists**: The catalog is shuffled by **seed** and **interleaved by vendor** so one provider does not show up as a single block—closer to a messy real directory and better for “who gets picked when everything is in the mix.”
- **Teachable in public**: Share the repo; participants run it locally. No accounts, no server.

---

## What you get in the app

| Area | What it’s for |
|------|----------------|
| **1 · PR review** | A fictional pull request on the left; a **thread-style model rail** on the right (search, scroll, **Primary** and **Backup**, then **Save**). |
| **2 · Compare two** | Pairwise comparison between two models from the catalog. |
| **3 · Gemini rubric** | Structured, scenario-based rubric (still **no** live Gemini API—definitions and sliders only). |

**Header**: download the current session or all sessions (JSONL), start a **new session**, and open **Options** to change the list **seed** or append the demo event bundle.

---

## Data and privacy

- All events stay in **this browser** (`localStorage`) until you use **Download this session** or **Download all**.
- Exports are plain JSON/JSONL you can process yourself. A helper script is included:

  ```bash
  node scripts/summarize-sessions.mjs path/to/sessions.jsonl
  ```

- **No API keys, no env vars required** to use the UI. (If you add a `.env` for something else, keep it out of git—see `.gitignore`.)

---

## Quick start

```bash
git clone <repository-url>
cd <repository-directory>
npm install
npm start
```

That runs the Vite dev server; your browser can open to the local URL (often `http://localhost:5173`). Use **Options** if you need a fixed list order: set **seed** in the bar or the URL as `?seed=12345`.

**Production build:**

```bash
npm run build
npm run preview   # optional: test the static build
```

---

## How analysis fits together

- **`coworker_submit`** (and related events) record **which model id** was primary/secondary, the **search query** at submit time, and **milliseconds to submit**—useful for “speed vs. search depth” questions.
- **`listOrderIds`** is stored on submit so you can reproduce **order effects** for a given **seed** and session.
- Pairwise and rubric tabs add **h2h_** and **gemini_**-style events for other study designs in the same session file.

---

## Project layout (high level)

- `src/models/catalog.ts` — fictional model **registry** (names for UI; not live endpoints).
- `src/lib/telemetry.ts` — sessions, `localStorage`, export helpers.
- `src/components/CoworkerTest.tsx` — PR + sidebar model picker.
- `scripts/summarize-sessions.mjs` — quick counts from a JSONL export.

---

## License

MIT—see [LICENSE](./LICENSE).

---

*Model names in the UI are for selection and research layouts only. This project is not affiliated with any model vendor.*
