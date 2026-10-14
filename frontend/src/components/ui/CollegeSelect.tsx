'use client';

import React, { useState, useEffect } from 'react';
import { School, Edit3, Loader2 } from 'lucide-react';

export interface CollegeSelectProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  showLabel?: boolean;
  className?: string;
  selectClassName?: string;
  inputClassName?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
}

export function CollegeSelect({
  value,
  onChange,
  id = 'college-select',
  name = 'college',
  disabled = false,
  required = false,
  label = 'College / Institution',
  showLabel = false,
  className = '',
  selectClassName,
  inputClassName,
  placeholder = 'Type your college / university name...',
  error,
  helperText,
}: CollegeSelectProps) {
  const [colleges, setColleges] = useState<string[]>(['MIET']);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOther, setIsOther] = useState<boolean>(false);
  const [customCollege, setCustomCollege] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    async function fetchColleges() {
      try {
        const res = await fetch('/api/colleges');
        if (!res.ok) throw new Error('Failed to fetch colleges');
        const data = await res.json();
        if (isMounted && data?.ok && Array.isArray(data.colleges) && data.colleges.length > 0) {
          setColleges(data.colleges);
        }
      } catch (_err) {
        // Fallback default
        if (isMounted) setColleges(['MIET']);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    void fetchColleges();
    return () => {
      isMounted = false;
    };
  }, []);

  // Synchronize internal `isOther` mode with incoming value
  useEffect(() => {
    if (!value) {
      setIsOther(false);
      setCustomCollege('');
      return;
    }

    const trimmed = value.trim();
    // Check if trimmed matches one of the colleges (case-insensitive)
    const match = colleges.find((c) => c.toLowerCase() === trimmed.toLowerCase());
    if (match) {
      setIsOther(false);
    } else if (!loading) {
      // Value is not in the list, so switch to "Other" mode and fill customCollege
      setIsOther(true);
      setCustomCollege(value);
    }
  }, [value, colleges, loading]);

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === '__OTHER__') {
      setIsOther(true);
      onChange(customCollege.trim());
    } else {
      setIsOther(false);
      onChange(selected);
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typed = e.target.value;
    setCustomCollege(typed);
    onChange(typed);
  };

  const defaultSelectClass =
    "w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none disabled:opacity-60 disabled:cursor-not-allowed";
  const defaultInputClass =
    "w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-600 disabled:opacity-60 disabled:cursor-not-allowed";

  // Determine current dropdown value
  let selectCurrentValue = '__OTHER__';
  if (!isOther) {
    const match = colleges.find((c) => c.toLowerCase() === (value || '').trim().toLowerCase());
    selectCurrentValue = match || colleges[0] || 'MIET';
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <label
          htmlFor={id}
          className="block text-xs font-mono uppercase tracking-wider text-slate-400"
        >
          {label} {required && <span className="text-emerald-500">*</span>}
        </label>
      )}

      {/* Primary College Selector */}
      <div className="relative">
        <School className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500 pointer-events-none" />
        <select
          id={id}
          name={name}
          disabled={disabled}
          required={required && !isOther}
          value={selectCurrentValue}
          onChange={handleDropdownChange}
          className={selectClassName || defaultSelectClass}
        >
          {colleges.map((c) => (
            <option key={c} value={c} className="bg-slate-950 text-slate-200">
              {c}
            </option>
          ))}
          <option value="__OTHER__" className="bg-slate-950 text-emerald-400 font-semibold">
            + Other (Enter your college name)
          </option>
        </select>
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-500 animate-spin pointer-events-none" />
        )}
      </div>

      {/* Dynamic Custom College Text Input if "Other" is selected */}
      {isOther && (
        <div className="relative animate-in fade-in slide-in-from-top-1 duration-200">
          <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-emerald-500 pointer-events-none" />
          <input
            type="text"
            id={`${id}-other`}
            disabled={disabled}
            required={required}
            placeholder={placeholder}
            value={customCollege}
            onChange={handleCustomInputChange}
            className={`${inputClassName || defaultInputClass} border-emerald-500/40 ring-1 ring-emerald-500/20`}
            autoFocus
          />
        </div>
      )}

      {helperText && <p className="text-[11px] text-slate-500 font-mono">{helperText}</p>}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

export default CollegeSelect;
