import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'avatar' | 'button' | 'table-row';
}

const variants: Record<NonNullable<SkeletonProps['variant']>, string> = {
  'text': 'h-4 rounded',
  'card': 'h-48 rounded-xl',
  'avatar': 'size-10 rounded-full',
  'button': 'h-10 rounded-lg',
  'table-row': 'h-12 rounded',
};

export const Skeleton: React.FC<SkeletonProps> = React.memo(function Skeleton({
  className = '',
  variant = 'text',
}) {
  return (
    <div
      className={`bg-slate-800/60 animate-pulse ${variants[variant]} ${className}`}
      aria-hidden="true"
    />
  );
});

export const SkeletonCard: React.FC<{ count?: number }> = React.memo(function SkeletonCard({ count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-5 space-y-4">
          <Skeleton variant="button" className="w-24" />
          <Skeleton variant="text" className="w-3/4" />
          <Skeleton variant="text" className="w-full" />
          <Skeleton variant="text" className="w-2/3" />
          <div className="pt-3">
            <Skeleton variant="button" className="w-full" />
          </div>
        </div>
      ))}
    </>
  );
});

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = React.memo(function SkeletonTable({ rows = 4, cols = 4 }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-4 px-6 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="text" className="flex-1 h-3" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-6 py-4 border-t border-slate-800/40">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} variant="text" className={`flex-1 h-4 ${c === 0 ? 'w-1/3' : c === cols - 1 ? 'w-20' : ''}`} />
          ))}
        </div>
      ))}
    </div>
  );
});
