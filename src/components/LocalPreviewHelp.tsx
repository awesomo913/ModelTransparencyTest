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
                This is a <strong>static front-end</strong> served by the Vite dev server. In the
                project folder run <code>npm install</code> once, then <code>npm run dev</code>. Open
                the URL it prints (usually <code>http://localhost:5173</code>) in Chrome or any
                browser—same as any other local web app.
              </p>
              <p>
                <strong>Network:</strong> The page does not call model vendors or GitHub. Selections,
                rubric scores, and timing are written to the browser’s <code>localStorage</code> and
                can be exported as JSON for routing audits or handoff to integration.
              </p>
              <p>
                <strong>Display seed:</strong> Optional number so the model list order matches between
                runs when validating UI or screenshots. It is not a network credential.
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
