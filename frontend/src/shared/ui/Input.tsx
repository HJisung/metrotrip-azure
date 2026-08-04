import type { InputHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-lg border border-outline-variant bg-surface-bright px-md text-body-md text-on-surface shadow-sm outline-none transition placeholder:text-on-surface-variant/70 focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
