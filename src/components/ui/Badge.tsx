'use client';

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'success' | 'warning';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const variants = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    accent: 'bg-emerald-900/30 text-emerald-300 border-emerald-800',
    success: 'bg-green-900/30 text-green-300 border-green-800',
    warning: 'bg-amber-900/30 text-amber-300 border-amber-800',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
