'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional description for screen readers */
  srDescription?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, srDescription, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
    const descriptionId = React.useId();
    const hasDescription = srDescription || ariaDescribedBy;

    return (
      <>
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all duration-200',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-muted-foreground',
            'hover:border-ring/50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'focus-visible:border-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
            className
          )}
          ref={ref}
          aria-describedby={hasDescription ? (ariaDescribedBy || descriptionId) : undefined}
          {...props}
        />
        {srDescription && (
          <span id={descriptionId} className="sr-only">
            {srDescription}
          </span>
        )}
      </>
    );
  }
);

Input.displayName = 'Input';

export { Input };
