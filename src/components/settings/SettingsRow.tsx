import type { ReactNode } from "react";

type SettingsRowProps = {
  label: string;
  description?: string;
  right?: ReactNode;
  onClick?: () => void;
};

export default function SettingsRow({ label, description, right, onClick }: SettingsRowProps) {
  const content = (
    <>
      <span className="settings-row-copy">
        <strong>{label}</strong>
        {description ? <small>{description}</small> : null}
      </span>
      {right ? <span className="settings-row-control">{right}</span> : null}
    </>
  );

  if (onClick) {
    return (
      <button className="settings-row settings-row-button" type="button" onClick={onClick}>
        {content}
      </button>
    );
  }

  return <div className="settings-row">{content}</div>;
}
