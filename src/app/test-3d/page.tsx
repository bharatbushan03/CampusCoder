import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { DynamicTest3D } from '@/components/3d/DynamicTest3D';

export const metadata = {
  title: '3D WebGL Canvas Test | CampusCoder',
  description: 'Verification page for React Three Fiber and Three.js rendering.',
};

export default function Test3DPage() {
  return (
    <div className="tech-grid min-h-screen py-20 selection:bg-emerald-500/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Navigation / Header */}
        <div className="space-y-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition-colors group">
            <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Home
          </Link>
          
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-widest">
              <Sparkles className="size-3" /> 3D Engine Verified
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight font-mono">
              3D Animation <span className="text-emerald-500 underline decoration-emerald-500/20 underline-offset-8">Canvas</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
              This sandbox page displays a client-side rendered 3D torus. It uses React Three Fiber and OrbitControls. It is dynamically imported with SSR disabled.
            </p>
          </div>
        </div>

        {/* 3D Component Rendering */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-700 pointer-events-none"></div>
          <DynamicTest3D />
        </div>

        {/* Diagnostic Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
            <h3 className="font-bold text-white font-mono text-sm uppercase tracking-wider text-emerald-400">Environment Specs</h3>
            <ul className="space-y-2 text-xs font-mono text-slate-400">
              <li>Framework: Next.js (App Router)</li>
              <li>Renderer: WebGL / Three.js</li>
              <li>Bindings: React Three Fiber</li>
              <li>Helper Pack: R3F Drei</li>
            </ul>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
            <h3 className="font-bold text-white font-mono text-sm uppercase tracking-wider text-emerald-400">Performance Notes</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dynamically imported using `ssr: false` to ensure zero impact on Server-Side Rendering response times. WebGL assets initialize asynchronously on client hydration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
