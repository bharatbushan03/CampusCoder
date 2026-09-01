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
      className={`rounded-xl border border-white/[0.07] bg-[#0e1422] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.4)] hover:border-white/[0.14] transition-all duration-150 ${className}`}
    >
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        {Icon && <Icon className="size-4 text-emerald-400/80" />}
      </div>
      <div className="mt-2.5 flex items-baseline gap-3">
        <p className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono tabular-nums">{value}</p>
        {trend && (
          <span
            className={`font-mono text-xs font-semibold ${
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

