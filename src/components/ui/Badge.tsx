import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
  className?: string;
}

const variants = {
  default: 'bg-slate-800 text-slate-300',
  accent: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  success: 'bg-green-500/10 text-green-400 border border-green-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  error: 'bg-red-500/10 text-red-400 border border-red-500/20',
};

export const Badge: React.FC<BadgeProps> = React.memo(function Badge({
  variant = 'default',
  children,
  className = '',
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
});
