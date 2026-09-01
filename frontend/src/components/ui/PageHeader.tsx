import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  kicker?: string;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = React.memo(function PageHeader({
  title,
  description,
  kicker,
  action,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/[0.07] ${className}`}
    >
      <div className="space-y-1.5">
        {kicker && (
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            {kicker}
          </span>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
});

