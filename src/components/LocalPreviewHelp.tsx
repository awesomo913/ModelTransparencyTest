import { useState } from "react";

/** Explains that ModelTransparencyTester is fully local to the machine. */
export function LocalPreviewHelp() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="btn text" onClick={() => setOpen(true)}>
        How this works locally
      </button>
      {open && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="local-preview-title"
        >
          <div className="modal">
            <div className="modal-head">
              <h2 id="local-preview-title">Local preview in Chrome</h2>
              <button
                type="button"
                className="btn icon"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>ModelTransparencyTester</strong> runs only in your browser. From this
                project folder: <code>npm install</code> then <code>npm start</code> (or{" "}
                <code>npm run dev</code>). The page may open automatically—no traffic is sent to
                model companies.
              </p>
              <p>
                Events are stored in this browser until you <strong>Download this session</strong> or{" "}
                <strong>Download all</strong> (JSON / JSONL). Use <strong>Options</strong> to set the
                catalog <strong>seed</strong> (order of the mixed list) or append a demo log.
              </p>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn" onClick={() => setOpen(false)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
