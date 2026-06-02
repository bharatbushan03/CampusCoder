'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '@/components/animations/ScrollAnimations';

type ButtonPropsBase = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'
>;

interface ButtonProps extends ButtonPropsBase {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

const baseStyles =
  'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500/30 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none';

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-emerald-500 text-emerald-950 hover:bg-emerald-400 font-semibold shadow-sm',
  secondary:
    'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 font-medium',
  outline:
    'bg-transparent border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white',
  ghost:
    'bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/50',
  danger:
    'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white',
};

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-8 py-3 text-base',
};

export const Button: React.FC<ButtonProps> = React.memo(function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  isLoading = false,
  children,
  disabled,
  form,
  formAction,
  name,
  tabIndex,
  title,
  value,
  onClick,
  onBlur,
  onFocus,
  onKeyDown,
  onKeyUp,
  onMouseEnter,
  onMouseLeave,
  id,
  autoFocus,
  style,
}) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <motion.button
      type="button"
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || disabled}
      whileHover={reducedMotion ? {} : { scale: 1.02 }}
      whileTap={reducedMotion ? {} : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      form={form}
      formAction={formAction}
      name={name}
      tabIndex={tabIndex}
      title={title}
      value={value}
      id={id}
      autoFocus={autoFocus}
      style={style}
      onClick={onClick}
      onBlur={onBlur}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {isLoading && (
        <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </motion.button>
  );
});
