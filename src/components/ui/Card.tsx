import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  hoverEffect = true,
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={`bg-slate-900/60 backdrop-blur-md border border-emerald-500/10 rounded-xl p-6 ${
        hoverEffect ? 'glow-box hover:border-emerald-500/30' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
