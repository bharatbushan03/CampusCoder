'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Share2 } from 'lucide-react';

function StaticGlobeFallback() {
  return (
    <div className="w-full h-full min-h-[350px] md:min-h-[450px] rounded-3xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-center relative overflow-hidden group">
      {/* Decorative gradients */}
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-teal-500/5 z-0"></div>
      
      {/* Pulsing rings represent the network */}
      <div className="absolute size-72 rounded-full border border-emerald-500/5 motion-safe:animate-pulse-slow opacity-25"></div>
      <div className="absolute size-56 rounded-full border border-emerald-500/10 motion-safe:animate-ping opacity-10"></div>
      <div className="absolute size-40 rounded-full border border-emerald-500/15 motion-safe:animate-pulse-slow"></div>

      {/* Floating labels as decorative text absolute bubbles */}
      <div className="absolute top-[20%] left-[20%] px-3 py-1 rounded-full bg-slate-900/90 border border-emerald-500/20 text-[10px] font-mono text-emerald-400 shadow-lg motion-safe:animate-float">
        Workshops
      </div>
      <div className="absolute bottom-[25%] left-[15%] px-3 py-1 rounded-full bg-slate-900/90 border border-emerald-500/20 text-[10px] font-mono text-emerald-400 shadow-lg motion-safe:animate-float delay-700">
        Events
      </div>
      <div className="absolute top-[28%] right-[10%] px-3 py-1 rounded-full bg-slate-900/90 border border-emerald-500/20 text-[10px] font-mono text-emerald-400 shadow-lg motion-safe:animate-float delay-1000">
        Coding Challenges
      </div>
      <div className="absolute bottom-[20%] right-[18%] px-3 py-1 rounded-full bg-slate-900/90 border border-emerald-500/20 text-[10px] font-mono text-emerald-400 shadow-lg motion-safe:animate-float delay-1500">
        Peer Learning
      </div>
      <div className="absolute top-[12%] right-[40%] px-3 py-1 rounded-full bg-slate-900/90 border border-emerald-500/20 text-[10px] font-mono text-emerald-400 shadow-lg motion-safe:animate-float delay-300">
        Placement Prep
      </div>

      {/* Central Visual */}
      <div className="relative z-10 text-center space-y-4 p-8">
        <div className="p-5 rounded-full bg-slate-950/90 border border-emerald-500/30 inline-block shadow-2xl motion-safe:animate-float">
          <Share2 className="size-10 text-emerald-400" />
        </div>
      </div>
    </div>
  );
}

const DynamicCommunityGlobe = dynamic(
  () => import('./CommunityGlobe'),
  {
    ssr: false,
    loading: () => <StaticGlobeFallback />,
  }
);

export default DynamicCommunityGlobe;
