'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Building2, Check, Plus, School } from 'lucide-react';

export interface CampusScopeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
}

export function CampusScopeSelector({
  value,
  onChange,
  disabled = false,
  label = 'Campus / College Scope',
}: CampusScopeSelectorProps) {
  const [colleges, setColleges] = useState<string[]>(['MIET']);
  const [loading, setLoading] = useState<boolean>(true);
  const [customInput, setCustomInput] = useState<string>('');

  // Mode: 'all' | 'single' | 'multiple'
  const determineInitialMode = (val: string): 'all' | 'single' | 'multiple' => {
    if (!val || val.trim().toUpperCase() === 'ALL' || val.trim().toUpperCase() === 'ALL CAMPUSES') {
      return 'all';
    }
    if (val.includes(',')) {
      return 'multiple';
    }
    return 'single';
  };

  const [mode, setMode] = useState<'all' | 'single' | 'multiple'>(() => determineInitialMode(value));
  const [singleCampus, setSingleCampus] = useState<string>(() => {
    if (determineInitialMode(value) === 'single') return value || 'MIET';
    return 'MIET';
  });
  const [multipleCampuses, setMultipleCampuses] = useState<string[]>(() => {
    if (value && value.includes(',')) {
      return value.split(',').map((c) => c.trim()).filter(Boolean);
    }
    return ['MIET'];
  });

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

  // Sync mode changes to parent
  const handleModeChange = (newMode: 'all' | 'single' | 'multiple') => {
    setMode(newMode);
    if (newMode === 'all') {
      onChange('ALL');
    } else if (newMode === 'single') {
      onChange(singleCampus || 'MIET');
    } else if (newMode === 'multiple') {
      const list = multipleCampuses.length > 0 ? multipleCampuses : ['MIET'];
      onChange(list.join(', '));
    }
  };

  const handleSingleSelect = (val: string) => {
    setSingleCampus(val);
    onChange(val);
  };

  const toggleMultipleCampus = (campusName: string) => {
    let updated: string[];
    if (multipleCampuses.includes(campusName)) {
      updated = multipleCampuses.filter((c) => c !== campusName);
      if (updated.length === 0) {
        updated = [campusName]; // Keep at least one
      }
    } else {
      updated = [...multipleCampuses, campusName];
    }
    setMultipleCampuses(updated);
    onChange(updated.join(', '));
  };

  const handleAddCustomCampus = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customInput.trim();
    if (!trimmed) return;

    if (!colleges.includes(trimmed)) {
      setColleges((prev) => [...prev, trimmed]);
    }

    if (mode === 'single') {
      setSingleCampus(trimmed);
      onChange(trimmed);
    } else if (mode === 'multiple') {
      if (!multipleCampuses.includes(trimmed)) {
        const updated = [...multipleCampuses, trimmed];
        setMultipleCampuses(updated);
        onChange(updated.join(', '));
      }
    }
    setCustomInput('');
  };

  return (
    <div className="space-y-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
          <Building2 className="size-4 text-emerald-400" />
          {label}
        </label>
        <span className="text-[11px] font-mono text-slate-400">
          Specify target audience for this competition
        </span>
      </div>

      {/* Scope Mode Selector Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleModeChange('all')}
          className={`px-3 py-2.5 rounded-xl text-xs font-mono font-medium flex items-center justify-center gap-2 border transition-all ${
            mode === 'all'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <Globe className="size-3.5" /> All Campuses
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => handleModeChange('single')}
          className={`px-3 py-2.5 rounded-xl text-xs font-mono font-medium flex items-center justify-center gap-2 border transition-all ${
            mode === 'single'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <School className="size-3.5" /> Single Campus
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => handleModeChange('multiple')}
          className={`px-3 py-2.5 rounded-xl text-xs font-mono font-medium flex items-center justify-center gap-2 border transition-all ${
            mode === 'multiple'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <Building2 className="size-3.5" /> Selected Campuses
        </button>
      </div>

      {/* Mode Details */}
      {mode === 'all' && (
        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs font-mono text-emerald-300/90 flex items-center gap-2">
          <Globe className="size-4 shrink-0 text-emerald-400" />
          <span>Global Flagship — Open to students from all colleges and universities nationwide.</span>
        </div>
      )}

      {mode === 'single' && (
        <div className="space-y-2 pt-1">
          <label className="text-[11px] font-mono text-slate-400">Choose Specific Campus:</label>
          <select
            disabled={disabled || loading}
            value={singleCampus}
            onChange={(e) => handleSingleSelect(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500/50"
          >
            {colleges.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}

      {mode === 'multiple' && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono text-slate-400">
              Select Campuses ({multipleCampuses.length} selected):
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            {colleges.map((c) => {
              const isSelected = multipleCampuses.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleMultipleCampus(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 border transition-all ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {isSelected ? <Check className="size-3 text-emerald-400" /> : <Plus className="size-3 text-slate-500" />}
                  {c}
                </button>
              );
            })}
          </div>

          {/* Add custom campus to selection */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              placeholder="+ Add another campus..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomCampus(e);
                }
              }}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
            <button
              type="button"
              onClick={handleAddCustomCampus}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
