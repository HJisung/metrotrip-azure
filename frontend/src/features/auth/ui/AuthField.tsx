import { useState } from 'react';
import { Input } from '../../../shared/ui/Input';
import { cn } from '../../../shared/lib/cn';
import { AuthMessage } from './AuthMessage';
import { Eye, EyeOff } from 'lucide-react';

type AuthFieldProps = {
  label: string;
  type?: 'text' | 'email' | 'password';
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  required?: boolean;
  autoFocus?: boolean;
  readOnly?: boolean;
  className?: string;
  error?: string;
};

export function AuthField({ label, type = 'text', value, placeholder, onChange, required = true, autoFocus = false, readOnly = false, className, error }: AuthFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <label className={cn('block', className)}>
      <span className="text-[var(--auth-label-size)] font-semibold text-on-surface">{label}</span>
      <div className="relative mt-xs">
        <Input
          className={cn(type === 'password' ? 'pr-11' : undefined, error && 'border-error focus:border-error focus:ring-error/15')}
          type={inputType}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          autoFocus={autoFocus}
          readOnly={readOnly}
        />
        {type === 'password' && (
          <button
            type="button"
            className="absolute right-xs top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-surface-container-low hover:text-on-surface"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            aria-pressed={showPassword}
          >
            {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        )}
      </div>
      <AuthMessage message={error} error />
    </label>
  );
}
