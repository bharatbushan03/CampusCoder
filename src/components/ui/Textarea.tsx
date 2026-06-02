import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, className = '', id, ...props }, ref) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-400"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`w-full bg-slate-900/50 border ${
            error ? 'border-red-500/50' : 'border-slate-700'
          } rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500/20 transition-colors resize-vertical ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
