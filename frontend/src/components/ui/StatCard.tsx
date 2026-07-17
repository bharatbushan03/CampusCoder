import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = React.memo(function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  className = '',
}) {
  return (
    <div
      className={`rounded-xl border border-slate-800/60 bg-slate-900/50 p-5 ${className}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        {Icon && <Icon className="size-4 text-slate-500" />}
      </div>
      <div className="mt-2 flex items-baseline gap-3">
        <p className="text-2xl font-bold text-slate-50">{value}</p>
        {trend && (
          <span
            className={`text-xs font-medium ${
              trend.positive ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {trend.positive ? '+' : ''}{trend.value}
          </span>
        )}
      </div>
    </div>
  );
});
