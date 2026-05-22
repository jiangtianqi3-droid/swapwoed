import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: ReactNode;
  tone?: "red" | "green" | "yellow" | "blue" | "neutral";
  helper?: string;
};

export default function StatCard({ label, value, tone = "neutral", helper }: StatCardProps) {
  return (
    <section className={`stat-card tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {helper ? <small>{helper}</small> : null}
    </section>
  );
}
