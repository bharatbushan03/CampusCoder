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
  kbd?: string;
  children: React.ReactNode;
}

const baseStyles =
  'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-1 focus-visible:ring-offset-[#080b11] disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none';

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-emerald-500 text-[#080b11] hover:bg-emerald-400 font-semibold border border-emerald-400/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_3px_rgba(0,0,0,0.4)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_8px_rgba(16,185,129,0.3)]',
  secondary:
    'bg-[#0e1422] text-slate-100 hover:bg-[#151c2f] border border-white/[0.1] shadow-[0_1px_2px_rgba(0,0,0,0.3)] hover:border-white/[0.18]',
  outline:
    'bg-transparent border border-white/[0.12] text-slate-200 hover:bg-white/[0.04] hover:border-white/[0.22] hover:text-white',
  ghost:
    'bg-transparent text-slate-400 hover:text-white hover:bg-white/[0.05]',
  danger:
    'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30',
};

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5 max-md:min-h-[40px]',
  md: 'px-4 py-2 text-sm gap-2 max-md:min-h-[44px]',
  lg: 'px-6 py-2.5 text-sm md:text-base gap-2.5 max-md:min-h-[48px]',
};

export const Button: React.FC<ButtonProps> = React.memo(function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  isLoading = false,
  kbd,
  children,
  disabled,
  type = 'button',
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
      type={type}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || disabled}
      whileTap={reducedMotion ? {} : { scale: 0.98 }}
      transition={{ duration: 0.1, ease: [0.16, 1, 0.3, 1] }}
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
        <div className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
      {kbd && (
        <span className="ml-1.5 inline-flex items-center justify-center font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-black/20 border border-black/30 text-current opacity-80">
          {kbd}
        </span>
      )}
    </motion.button>
  );
});

