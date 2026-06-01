'use client';

import React from 'react';

interface CampusCoderLoaderProps {
  /** 'page' = full-screen centered overlay. 'inline' = compact block loader. */
  variant?: 'page' | 'inline';
  /** Optional label shown beneath the animation */
  label?: string;
}

const ORBIT_SYMBOLS = ['</>', '{}', '[]', '#', '&&'];

/**
 * Branded CampusCoder loader.
 * Uses pure CSS animations — zero JS animation cost, no Framer Motion overhead.
 * Fully respects prefers-reduced-motion via the `.motion-safe:` Tailwind modifier.
 */
export const CampusCoderLoader: React.FC<CampusCoderLoaderProps> = ({
  variant = 'page',
  label,
}) => {
  const isPage = variant === 'page';

  const animation = (
    <div
      className="flex flex-col items-center justify-center gap-4"
      aria-label="Loading…"
      role="status"
    >
      {/* ── Orbital ring + CC monogram ── */}
      <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>

        {/* Outer rotating ring */}
        <div
          className="absolute inset-0 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 motion-safe:animate-spin"
          style={{ animationDuration: '1.2s', animationTimingFunction: 'linear' }}
        />

        {/* Inner counter-rotating ring */}
        <div
          className="absolute rounded-full border border-emerald-500/10 border-b-emerald-500/40 motion-safe:animate-spin"
          style={{
            inset: 8,
            animationDuration: '2s',
            animationTimingFunction: 'linear',
            animationDirection: 'reverse',
          }}
        />

        {/* Orbiting code symbols */}
        {ORBIT_SYMBOLS.map((sym, i) => {
          const angle = (i / ORBIT_SYMBOLS.length) * 360;
          const rad = (angle * Math.PI) / 180;
          const r = 40; // orbit radius (half of 80px container)
          const x = Math.cos(rad) * r;
          const y = Math.sin(rad) * r;
          return (
            <span
              key={sym}
              className="absolute text-[7px] font-mono text-emerald-500/50 select-none motion-safe:animate-spin"
              style={{
                transform: `translate(${x}px, ${y}px)`,
                animationDuration: '6s',
                animationTimingFunction: 'linear',
                animationDelay: `${i * 0.2}s`,
                // Counter-rotate the glyph itself so it stays upright
                display: 'inline-block',
              }}
              aria-hidden
            >
              {sym}
            </span>
          );
        })}

        {/* Pulsing glow disc */}
        <div className="absolute size-10 rounded-full bg-emerald-500/10 blur-md motion-safe:animate-pulse" />

        {/* CC Monogram */}
        <div
          className="relative z-10 flex items-center justify-center size-9 rounded-xl bg-slate-950 border border-emerald-500/30 shadow-[0_0_16px_rgba(16,185,129,0.2)]"
        >
          <span className="text-xs font-extrabold font-mono text-emerald-400 tracking-tight leading-none select-none">
            CC
          </span>
        </div>
      </div>

      {/* Label */}
      <p className="text-xs font-mono text-slate-500 tracking-widest uppercase motion-safe:animate-pulse">
        {label ?? 'Loading\u2026'}
      </p>
    </div>
  );

  if (isPage) {
    return (
      <div className="tech-grid min-h-screen flex items-center justify-center py-20">
        {animation}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-16 w-full">
      {animation}
    </div>
  );
};

export default CampusCoderLoader;
