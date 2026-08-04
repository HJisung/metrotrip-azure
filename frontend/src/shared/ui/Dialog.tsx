import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export function DialogContent({ className, children, ...props }: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-on-background/35 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=open]:animate-in" />
      <DialogPrimitive.Content
        className={cn('fixed left-1/2 top-1/2 z-[100] max-h-[90dvh] w-[calc(100%-2rem)] max-w-[28rem] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-outline-variant bg-surface-bright p-lg text-on-surface shadow-2xl outline-none', className)}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-md top-md flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-surface-container-low hover:text-on-surface" aria-label="닫기">
          <X size={18} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-xs pr-xl', className)} {...props} />;
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn('text-headline-md font-heading text-on-surface', className)} {...props} />;
}

export function DialogDescription({ className, ...props }: ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn('text-body-md text-on-surface-variant', className)} {...props} />;
}
