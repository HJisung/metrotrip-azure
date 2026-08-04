import { Input } from '../../../shared/ui/Input';

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
      <Input
        className="mt-xs"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}
