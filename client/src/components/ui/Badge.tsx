import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'emerald' | 'gold' | 'blue' | 'slate' | 'rose' | 'amber';
  size?: 'sm' | 'md';
}

export function Badge({
  children,
  variant = 'slate',
  size = 'sm',
  className = '',
  ...props
}: BadgeProps) {
  const sizeStyles = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  }[size];

  const variantStyles = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
    gold: 'bg-amber-500/10 text-amber-300 border border-amber-500/25',
    blue: 'bg-sky-500/10 text-sky-400 border border-sky-500/25',
    slate: 'bg-slate-800 text-slate-300 border border-slate-700',
    rose: 'bg-rose-500/10 text-rose-400 border border-rose-500/25',
    amber: 'bg-amber-500/10 text-amber-400 border border-amber-500/25',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
