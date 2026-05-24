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
  return (
    <div className="confirm-backdrop" role="presentation" onClick={onCancel}>
      <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(event) => event.stopPropagation()}>
        <h2 id="confirm-title">{title}</h2>
        <p>{description}</p>
        <div className="confirm-actions">
          <button className="confirm-cancel" type="button" onClick={onCancel}>
            取消
          </button>
          <button className={`confirm-ok ${tone === "danger" ? "danger" : ""}`} type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
