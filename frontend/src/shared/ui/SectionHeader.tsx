import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function SectionHeader({ eyebrow, title, description, action, className }: SectionHeaderProps) {
  return (
    <header className={cn('flex items-start justify-between gap-md', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-xs text-label-caps text-primary">{eyebrow}</p>}
        <h2 className="text-headline-sm font-heading text-on-surface">{title}</h2>
        {description && <p className="mt-xs text-body-md text-on-surface-variant">{description}</p>}
      </div>
      {action}
    </header>
  );
}
