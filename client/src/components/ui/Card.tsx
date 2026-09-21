import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glow?: 'emerald' | 'gold' | 'none';
}

export function Card({
  children,
  hover = false,
  glow = 'none',
  className = '',
  ...props
}: CardProps) {
  const glowClass = {
    emerald: 'border-emerald-500/30 shadow-glow-emerald',
    gold: 'border-amber-500/30 shadow-glow-gold',
    none: 'border-white/10',
  }[glow];

  return (
    <div
      className={`glass-panel rounded-2xl p-6 ${glowClass} ${
        hover ? 'glass-panel-hover' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-lg font-bold text-white tracking-tight ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm text-slate-400 mt-1 ${className}`}>{children}</p>;
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mt-6 pt-4 border-t border-white/5 flex items-center justify-between ${className}`}>{children}</div>;
}
