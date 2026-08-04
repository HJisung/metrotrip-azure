import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Card } from './Card';
import { Icon } from './Icon';

type PreviewFrameProps = {
  title: string;
  description: string;
  notice: string;
  wide?: boolean;
  children: ReactNode;
};

export function PreviewFrame({ title, description, notice, wide = false, children }: PreviewFrameProps) {
  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className={cn('flex flex-col gap-lg p-md sm:p-xl', wide ? 'w-full' : 'mx-auto max-w-4xl')}>
        <header className="flex flex-col gap-sm pt-sm">
          <span className="w-fit rounded-full bg-primary-container px-sm py-xs text-label-caps text-on-primary-container">METROTRIP</span>
          <div>
            <h2 className="text-display-lg font-heading text-on-surface">{title}</h2>
            <p className="mt-xs max-w-2xl text-body-lg text-on-surface-variant">{description}</p>
          </div>
        </header>

        <Card className="flex items-start gap-sm border-tertiary/25 bg-tertiary-container/10 p-md shadow-none">
          <Icon name="info" className="mt-[2px] shrink-0 text-[19px] text-tertiary" />
          <p className="text-body-md text-on-surface-variant">{notice}</p>
        </Card>

        {children}
      </div>
    </div>
  );
}
