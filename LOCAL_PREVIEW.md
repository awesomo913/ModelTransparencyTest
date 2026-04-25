# Running ModelTransparencyTester locally

This project is a **Vite + React** app. The UI **never** calls model providers; it only records your interactions for export as JSON/JSONL.

1. `npm install`
2. `npm start` (or `npm run dev`)
3. Open the URL the terminal prints (commonly `http://localhost:5173`).

**Options** in the header: change the list **seed** (order of the mixed catalog) or **Append demo events** to populate the log without manual clicks.

State is held in the browser’s `localStorage` until you use **Download this session** or **Download all**.

The in-app **How this runs locally** button shows the same summary for people watching a screen share.
