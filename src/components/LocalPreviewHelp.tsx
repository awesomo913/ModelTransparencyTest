import { useState } from "react";

/**
 * Boring, product-shaped copy: explains local Vite/Chrome without sounding like a lab instrument.
 */
export function LocalPreviewHelp() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="btn text" onClick={() => setOpen(true)}>
        How this runs locally
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
                From this folder: <code>npm install</code> then <code>npm start</code>. A browser
                opens to a local page—nothing is sent to model companies.
              </p>
              <p>
                Data you save lives in this browser until you use <strong>Download this session</strong>{" "}
                (JSON file). <strong>Options</strong> in the header can change the list seed.
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
