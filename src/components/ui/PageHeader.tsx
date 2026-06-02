import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = React.memo(function PageHeader({
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${className}`}
    >
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-50">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-slate-400">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
});
