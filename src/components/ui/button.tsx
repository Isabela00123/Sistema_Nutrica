import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer shadow-sm',
          variant === 'default' &&
            'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] shadow-emerald-700/20',
          variant === 'outline' &&
            'border border-emerald-200 bg-transparent hover:bg-emerald-50 text-emerald-800',
          variant === 'ghost' &&
            'hover:bg-emerald-50 text-emerald-800 shadow-none',
          variant === 'secondary' &&
            'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 shadow-none',
          size === 'default' && 'h-11 px-5 py-2.5',
          size === 'sm' && 'h-9 px-3.5 text-xs',
          size === 'lg' && 'h-12 px-6 text-base',
          size === 'icon' && 'h-10 w-10 p-0',
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
