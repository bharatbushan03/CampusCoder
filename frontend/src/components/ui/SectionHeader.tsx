import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  badge?: string;
  kicker?: string;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = React.memo(function SectionHeader({
  title,
  subtitle,
  align = 'left',
  badge,
  kicker,
  className = '',
}) {
  return (
    <div
      className={`space-y-2.5 ${
        align === 'center' ? 'text-center max-w-2xl mx-auto' : 'text-left'
      } ${className}`}
    >
      {(kicker || badge) && (
        <div className={`flex items-center gap-2 ${align === 'center' ? 'justify-center' : 'justify-start'}`}>
          {kicker && (
            <span className="font-mono text-[11px] font-semibold tracking-widest text-emerald-400 uppercase">
              {kicker}
            </span>
          )}
          {badge && (
            <span className="inline-flex items-center px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.03] text-[10px] font-mono uppercase tracking-wider text-slate-300">
              {badge}
            </span>
          )}
        </div>
      )}
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-2xl">
          {subtitle}
        </p>
      )}
    </div>
  );
});

