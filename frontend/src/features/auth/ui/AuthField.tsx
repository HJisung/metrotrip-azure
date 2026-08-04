type AuthFieldProps = {
  label: string;
  type?: 'text' | 'email' | 'password';
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  required?: boolean;
};

export function AuthField({ label, type = 'text', value, placeholder, onChange, required = true }: AuthFieldProps) {
  return (
    <label className="block">
      <span className="text-body-md font-semibold text-on-surface">{label}</span>
      <input
        className="mt-xs w-full rounded-md border border-outline-variant bg-surface px-md py-sm text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}
