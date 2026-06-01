'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import the 3D test component with SSR disabled
export const DynamicTest3D = dynamic(
  () => import('./Test3DComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] md:h-[500px] bg-slate-950/50 rounded-2xl border border-slate-800 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="size-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin mx-auto"></div>
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            Initializing WebGL Engine...
          </p>
        </div>
      </div>
    ),
  }
);
