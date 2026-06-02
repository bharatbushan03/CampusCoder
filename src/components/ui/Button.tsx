import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none active:scale-[0.98]';

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 font-bold',
  secondary: 'bg-slate-900 text-emerald-400 hover:bg-slate-800 border border-emerald-500/20 hover:border-emerald-500/40 font-semibold',
  outline: 'bg-transparent border border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/50 hover:text-white',
  ghost: 'bg-transparent text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/5',
  danger: 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white',
};

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-8 py-3.5 text-base',
};

export const Button: React.FC<ButtonProps> = React.memo(function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  isLoading = false,
  children,
  ...props
}) {
  return (
    <button type="button"
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
});
