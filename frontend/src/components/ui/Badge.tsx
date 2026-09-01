import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'error' | 'neutral';
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

const variants = {
  default: 'bg-white/[0.04] text-slate-300 border-white/[0.08]',
  accent: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
  success: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  error: 'bg-red-500/10 text-red-300 border-red-500/20',
  neutral: 'bg-white/[0.06] text-slate-200 border-white/[0.1]',
};

const dotColors = {
  default: 'bg-slate-400',
  accent: 'bg-emerald-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  error: 'bg-red-400',
  neutral: 'bg-slate-300',
};

export const Badge: React.FC<BadgeProps> = React.memo(function Badge({
  variant = 'default',
  dot = false,
  children,
  className = '',
}) {
  const showDot = dot || variant === 'accent';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-mono text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 select-none ${variants[variant]} ${className}`}
    >
      {showDot && (
        <span className={`size-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
});

