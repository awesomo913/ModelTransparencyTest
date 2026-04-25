import { useState, useEffect } from "react";
import { CATALOG } from "../models/catalog";
import { parseIdList, type ListOrderMode } from "../lib/listOrder";

type Props = {
  open: boolean;
  onClose: () => void;
  orderMode: ListOrderMode;
  customIdsText: string;
  onApply: (mode: ListOrderMode, customIds: string[] | null) => void;
  lastInvalid: string[];
};

export function ListOrderModal({
  open,
  onClose,
  orderMode,
  customIdsText: initialText,
  onApply,
  lastInvalid,
}: Props) {
  const [text, setText] = useState(initialText);

  useEffect(() => {
    if (open) setText(initialText);
  }, [open, initialText]);

  if (!open) return null;

  return (
      <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mtt-list-order-title"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 id="mtt-list-order-title">List order</h2>
          <button type="button" className="btn icon" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">
          <p>
            <strong>Default</strong> uses the numeric seed and mixed vendor interleaving.{" "}
            <strong>Custom</strong> shows models in the order you list (unknown ids are skipped; the rest
            of the catalog is appended in catalog order).
          </p>
          <div className="form-block">
            <span className="label">Model ids (one per line, or comma-separated)</span>
            <textarea
              className="input ta"
              rows={10}
              value={text}
              onChange={(e) => setText(e.target.value)}
              spellCheck={false}
            />
            <p className="meta">
              {CATALOG.length} ids in catalog.{" "}
              <button
                type="button"
                className="btn text"
                onClick={() => setText(CATALOG.map((m) => m.id).join("\n"))}
              >
                Fill with all catalog ids
              </button>
            </p>
            {orderMode === "custom" && lastInvalid.length > 0 && (
              <p className="warn">Last apply skipped unknown ids: {lastInvalid.join(", ")}</p>
            )}
          </div>
        </div>
        <div className="modal-foot modal-foot-spread">
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              onApply("interleave", null);
              onClose();
            }}
          >
            Use default order
          </button>
          <div className="modal-foot-right">
            <button type="button" className="btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                const ids = parseIdList(text);
                onApply("custom", ids.length > 0 ? ids : null);
                onClose();
              }}
            >
              Apply custom order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
