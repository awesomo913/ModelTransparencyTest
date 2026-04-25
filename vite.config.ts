import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Name passed to the `open` package so `npm run dev` launches Google Chrome. */
function chromeForOpen() {
  switch (process.platform) {
    case "win32":
      return "chrome";
    case "darwin":
      return "google chrome";
    default:
      return "google-chrome";
  }
}

export default defineConfig({
  plugins: [react()],
  server: {
    open: chromeForOpen(),
  },
});
