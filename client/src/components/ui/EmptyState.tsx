import React from 'react';

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="glass-panel rounded-2xl border border-white/10 p-10 text-center">
      {icon && <div className="mb-3 flex justify-center text-slate-500">{icon}</div>}
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mt-1 text-sm text-slate-400">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingBlock() {
  return (
    <div className="flex items-center justify-center py-16 text-slate-400">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-hero-emerald border-t-transparent" />
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-rose-500/30 bg-rose-950/30 p-4 text-sm text-rose-200">
      {message}
    </div>
  );
}
