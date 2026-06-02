import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  badge?: string;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = React.memo(function SectionHeader({
  title,
  subtitle,
  align = 'center',
  badge,
  className = '',
}) {
  return (
    <div
      className={`space-y-3 ${
        align === 'center' ? 'text-center max-w-2xl mx-auto' : 'text-left'
      } ${className}`}
    >
      {badge && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-300">
          {badge}
        </span>
      )}
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-50">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm md:text-base text-slate-400 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
});
