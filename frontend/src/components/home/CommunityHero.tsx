'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DynamicHeroCodeScene } from '@/components/3d/DynamicHeroCodeScene';

// Animation variants (same as DSAEventHero for consistency)
const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants: any = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 20 } }
};

export function CommunityHero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-28 border-b border-slate-800/60 bg-slate-950">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[70%] bg-emerald-500/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full" />

        {/* Particle Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(#10b981 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Left Content */}
          <motion.div
            className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Headings */}
            <motion.div variants={itemVariants} className="space-y-4 max-w-2xl">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
                Learn, Code, and Grow <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Together</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
                CampusCoder is a student-driven community where you can collaborate on coding challenges, attend workshops, and prepare for placements with peers.
              </p>
            </motion.div>

            {/* CTAs */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto">
              <Link href="/events" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto h-14 px-8 text-base font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 transition-all"
                >
                  Explore Events <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/about" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-14 px-8 text-base border-slate-700 hover:bg-slate-800/50 hover:text-white transition-all"
                >
                  Join Community <ArrowRight className="ml-1 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Content - Three.js 3D Interactive Animation Scene */}
          <motion.div
            className="lg:col-span-5 relative w-full aspect-square max-w-[480px] sm:max-w-[520px] mx-auto lg:mx-0 mt-8 lg:mt-0"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* 3D Scene Container */}
            <div className="relative w-full h-full rounded-3xl bg-slate-950/50 border border-slate-800/80 backdrop-blur-md overflow-hidden shadow-2xl group">
              {/* Top accent line */}
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent z-20" />

              {/* Three.js Canvas */}
              <div className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing">
                <DynamicHeroCodeScene />
              </div>
            </div>

            {/* Glowing outer ambient border */}
            <div className="absolute -inset-1 bg-gradient-to-tr from-emerald-500/25 via-teal-500/10 to-indigo-500/10 rounded-3xl -z-10 blur-xl opacity-70 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}