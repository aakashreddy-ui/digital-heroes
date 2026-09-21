import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id || props.name;
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
      )}
      <input
        id={inputId}
        className={`w-full rounded-xl bg-slate-900/80 border px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 ${
          error ? 'border-rose-500/50' : 'border-white/10'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </label>
  );
}
