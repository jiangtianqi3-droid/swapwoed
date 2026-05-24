type SettingsSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
};

export default function SettingsSwitch({ checked, onChange, label }: SettingsSwitchProps) {
  return (
    <button
      className={`settings-switch ${checked ? "is-on" : ""}`}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onChange(!checked);
      }}
    >
      <span />
    </button>
  );
}
