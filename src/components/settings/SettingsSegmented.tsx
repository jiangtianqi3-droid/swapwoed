type Option<T extends string | number> = {
  label: string;
  value: T;
};

type SettingsSegmentedProps<T extends string | number> = {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
};

export default function SettingsSegmented<T extends string | number>({
  value,
  options,
  onChange,
  ariaLabel,
}: SettingsSegmentedProps<T>) {
  return (
    <div className="settings-segmented" role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          className={option.value === value ? "active" : ""}
          key={String(option.value)}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
