import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
  className?: string;
}

const variants = {
  default: 'bg-slate-800 text-slate-300 border-slate-700',
  accent: 'bg-emerald-900/30 text-emerald-300 border-emerald-800 badge-live',
  success: 'bg-green-900/30 text-green-300 border-green-800',
  warning: 'bg-amber-900/30 text-amber-300 border-amber-800',
  error: 'bg-red-900/30 text-red-300 border-red-800',
};

export const Badge: React.FC<BadgeProps> = React.memo(function Badge({
  variant = 'default',
  children,
  className = '',
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
});
