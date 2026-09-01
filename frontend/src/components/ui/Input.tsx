import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, className = '', id, ...props }, ref) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-mono uppercase tracking-wider text-slate-400"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full bg-[#080b11] border ${
            error ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20' : 'border-white/[0.08] focus:border-emerald-500/50 focus:ring-emerald-500/20'
          } rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all duration-150 ${className}`}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-400 font-mono mt-1">{error}</p>
        )}
      </div>
    );
  }
);

