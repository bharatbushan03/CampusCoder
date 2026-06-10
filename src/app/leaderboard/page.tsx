'use client';

import React from 'react';
import { AnimatedSection } from '@/components/animations/ScrollAnimations';
import { Trophy, Medal } from 'lucide-react';

export default function LeaderboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-12 min-h-[70vh] flex flex-col items-center justify-center">
      <AnimatedSection className="space-y-6 text-center max-w-3xl mx-auto" direction="up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-widest">
          <Medal className="h-3 w-3" /> Rankings
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight font-mono">
          Community <span className="text-emerald-500">Leaderboard</span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base leading-relaxed">
          See who is topping the charts on LeetCode and Codeforces this week. 
          Keep grinding to see your name up here!
        </p>
      </AnimatedSection>

      <AnimatedSection className="text-center w-full" direction="up" delay={0.2}>
        <div className="py-16 px-8 bg-slate-900/30 border border-slate-800 rounded-3xl max-w-2xl mx-auto backdrop-blur-sm flex flex-col items-center gap-6">
          <div className="size-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <Trophy className="size-8 text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white font-mono">API Integration Pending</h2>
            <p className="text-slate-400 text-sm">We are connecting the leaderboard to external coding platforms. Check back soon!</p>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}
