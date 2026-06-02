import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  /** @deprecated use `hover` instead */
  hoverEffect?: boolean;
  /** @deprecated no longer used */
  glass?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = React.memo(function Card({
  hover,
  hoverEffect = true,
  glass: _glass,
  className = '',
  children,
  ...props
}) {
  const isHover = hover ?? hoverEffect;

  return (
    <div
      className={`rounded-xl border border-slate-800/60 bg-slate-900/50 transition-all duration-200 ${
        isHover ? 'hover:border-slate-700 hover:bg-slate-900/70' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});
