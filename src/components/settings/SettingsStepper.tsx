type SettingsStepperProps = {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  label: string;
};

export default function SettingsStepper({ value, min, max, step, onChange, label }: SettingsStepperProps) {
  const clampValue = (next: number) => Math.max(min, Math.min(max, next));

  return (
    <div className="settings-stepper" aria-label={label}>
      <button type="button" onClick={() => onChange(clampValue(value - step))} aria-label={`${label}减少`}>
        −
      </button>
      <span key={value}>{value}</span>
      <button type="button" onClick={() => onChange(clampValue(value + step))} aria-label={`${label}增加`}>
        +
      </button>
    </div>
  );
}
