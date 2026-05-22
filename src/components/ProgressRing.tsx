type ProgressRingProps = {
  value: number;
  label?: string;
};

export default function ProgressRing({ value, label = "完成率" }: ProgressRingProps) {
  const normalized = Math.max(0, Math.min(100, value));

  return (
    <div
      className="progress-ring"
      style={{ "--progress": `${normalized * 3.6}deg` } as React.CSSProperties}
      aria-label={`${label} ${normalized}%`}
    >
      <div>
        <strong>{normalized}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
