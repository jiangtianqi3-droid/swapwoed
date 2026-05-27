import { useState } from "react";

type ConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "danger" | "normal";
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({
  title,
  description,
  confirmLabel,
  tone = "normal",
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const [closing, setClosing] = useState(false);

  const closeWithAnimation = (callback: () => void) => {
    setClosing(true);
    window.setTimeout(callback, 170);
  };

  return (
    <div className={`confirm-backdrop ${closing ? "is-closing" : ""}`} role="presentation" onClick={() => closeWithAnimation(onCancel)}>
      <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(event) => event.stopPropagation()}>
        <h2 id="confirm-title">{title}</h2>
        <p>{description}</p>
        <div className="confirm-actions">
          <button className="confirm-cancel" type="button" onClick={() => closeWithAnimation(onCancel)}>
            取消
          </button>
          <button className={`confirm-ok ${tone === "danger" ? "danger" : ""}`} type="button" onClick={() => closeWithAnimation(onConfirm)}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
