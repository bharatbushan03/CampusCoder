import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  glass?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = React.memo(function Card({
  hoverEffect = true,
  glass = true,
  className = '',
  children,
  ...props
}) {
  return (
    <div
      className={`rounded-2xl border transition-all duration-300 ${
        glass ? 'bg-slate-900/40 backdrop-blur-xl border-slate-800/60' : 'bg-slate-950 border-slate-900'
      } ${
        hoverEffect ? 'hover:border-emerald-500/30 hover:bg-slate-900/60 group' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});
