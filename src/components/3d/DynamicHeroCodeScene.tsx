'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Terminal } from 'lucide-react';

function StaticHeroFallback() {
  return (
    <div className="w-full h-full min-h-[350px] md:min-h-[450px] rounded-3xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-center relative overflow-hidden group">
      {/* Decorative gradients */}
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-teal-500/5 z-0"></div>
      
      {/* Animated glowing rings (pulsing layout) */}
      <div className="absolute size-64 rounded-full border border-emerald-500/10 animate-ping opacity-25"></div>
      <div className="absolute size-48 rounded-full border border-emerald-500/20 animate-pulse-slow"></div>

      {/* Central Visual */}
      <div className="relative z-10 text-center space-y-4 p-8">
        <div className="p-5 rounded-full bg-slate-950/90 border border-emerald-500/30 inline-block shadow-2xl animate-float">
          <Terminal className="size-12 text-emerald-400" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-mono font-bold text-white uppercase tracking-widest">CampusCoder Hub</h3>
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Initializing Dev Ecosystem...</p>
        </div>
      </div>
    </div>
  );
}

export const DynamicHeroCodeScene = dynamic(
  () => import('./HeroCodeScene'),
  {
    ssr: false,
    loading: () => <StaticHeroFallback />,
  }
);
export default DynamicHeroCodeScene;
