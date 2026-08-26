'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
            {/* Badge */}
            <motion.div variants={itemVariants}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-300 text-xs font-mono font-bold tracking-widest uppercase">
                  Join the Community
                </span>
              </div>
            </motion.div>

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

          {/* Right Content - Simple illustration */}
          <motion.div
            className="lg:col-span-5 relative w-full aspect-square max-w-[500px] mx-auto lg:mx-0 mt-10 lg:mt-0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {/* Hologram Box container */}
            <div className="absolute inset-0 bg-slate-900/30 rounded-3xl border border-slate-800 backdrop-blur-sm overflow-hidden flex items-center justify-center">
              {/* Simple illustration: group of people coding */}
              <div className="text-center space-y-3">
                <Users className="size-12 text-emerald-400" />
                <p className="text-sm text-slate-400">Meet your coding peers</p>
                <div className="flex space-x-3">
                  <div className="w-3 h-3 bg-emerald-400 rounded" />
                  <div className="w-3 h-3 bg-teal-400 rounded" />
                  <div className="w-3 h-3 bg-emerald-400 rounded" />
                </div>
              </div>
            </div>

            {/* Glowing borders */}
            <div className="absolute -inset-0.5 bg-gradient-to-tr from-emerald-500/20 to-teal-500/5 rounded-3xl z-[-1] blur-md" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}