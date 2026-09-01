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
      className={`rounded-xl border border-white/[0.07] bg-[#0e1422] shadow-[0_1px_2px_rgba(0,0,0,0.4),0_4px_16px_rgba(0,0,0,0.15)] transition-all duration-150 ${
        isHover ? 'hover:border-white/[0.15] hover:bg-[#12192b]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

