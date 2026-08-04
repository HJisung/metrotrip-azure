import type { HTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('inline-flex items-center rounded-full bg-primary-container px-sm py-xs text-label-caps text-on-primary-container', className)} {...props} />;
}
