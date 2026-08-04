import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-xs whitespace-nowrap rounded-lg text-body-md font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-on-primary shadow-sm hover:bg-primary/90',
        secondary: 'bg-surface-container text-on-surface hover:bg-surface-container-high',
        outline: 'border border-outline-variant bg-surface-bright text-on-surface hover:border-primary/40 hover:bg-primary-container/25',
        ghost: 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
        destructive: 'bg-error text-on-error hover:bg-error/90',
      },
      size: {
        default: 'h-10 px-md py-sm',
        sm: 'h-9 px-sm',
        lg: 'h-11 px-lg',
        icon: 'h-10 w-10 rounded-full',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : 'button';
    return <Component ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);

Button.displayName = 'Button';
