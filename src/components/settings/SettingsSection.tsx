import type { ReactNode } from "react";

type SettingsSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export default function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <section className="settings-section">
      <div className="settings-section-heading">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="settings-card">{children}</div>
    </section>
  );
}
