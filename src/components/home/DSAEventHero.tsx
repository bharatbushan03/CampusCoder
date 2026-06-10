'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Globe2, 
  Code2, 
  ArrowRight,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Animation variants
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

const nodeVariants: any = {
  hidden: { scale: 0, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 200, damping: 15 } }
};

const edgeVariants: any = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { pathLength: 1, opacity: 1, transition: { duration: 1.5, ease: "easeInOut" } }
};

// Represents a simple node graph animation (Tree traversal concept)
function AlgorithmGraph() {
  const nodes = [
    { cx: 50, cy: 30 }, // Root
    { cx: 20, cy: 70 }, // Left Child
    { cx: 80, cy: 70 }, // Right Child
    { cx: 10, cy: 110 }, // Left-Left Child
    { cx: 35, cy: 110 }, // Left-Right Child
    { cx: 65, cy: 110 }, // Right-Left Child
    { cx: 90, cy: 110 }, // Right-Right Child
  ];

  const edges = [
    { x1: 50, y1: 30, x2: 20, y2: 70 }, // Root -> L
    { x1: 50, y1: 30, x2: 80, y2: 70 }, // Root -> R
    { x1: 20, y1: 70, x2: 10, y2: 110 }, // L -> LL
    { x1: 20, y1: 70, x2: 35, y2: 110 }, // L -> LR
    { x1: 80, y1: 70, x2: 65, y2: 110 }, // R -> RL
    { x1: 80, y1: 70, x2: 90, y2: 110 }, // R -> RR
  ];

  return (
    <div className="relative w-full h-full max-w-[400px] mx-auto opacity-70">
      <svg viewBox="0 0 100 140" className="w-full h-full overflow-visible">
        {/* Glow filters */}
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Edges */}
        {edges.map((edge, i) => (
          <motion.line
            key={`edge-${i}`}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            stroke="rgba(52, 211, 153, 0.4)" // emerald-400
            strokeWidth="1.5"
            variants={edgeVariants}
            initial="hidden"
            animate="visible"
          />
        ))}

        {/* Active edge traversals (pulsing lines) */}
        {edges.map((edge, i) => (
          <motion.line
            key={`edge-active-${i}`}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            stroke="#10b981" // emerald-500
            strokeWidth="2"
            filter="url(#glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: [0, 1, 1, 0], 
              opacity: [0, 1, 0, 0] 
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              delay: i * 0.4,
              ease: "linear"
            }}
          />
        ))}

        {/* Nodes */}
        {nodes.map((node, i) => (
          <motion.circle
            key={`node-${i}`}
            cx={node.cx}
            cy={node.cy}
            r="4"
            fill="#0f172a" // slate-900
            stroke="#10b981" // emerald-500
            strokeWidth="1.5"
            variants={nodeVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.5, r: 6, fill: "#10b981" }}
            transition={{ delay: i * 0.1 }}
          />
        ))}
      </svg>
    </div>
  );
}

export function DSAEventHero() {
  const eventDetails = [
    { icon: Calendar, text: '22-28 June 2026' },
    { icon: Clock, text: '6 PM - 9 PM IST' },
    { icon: Globe2, text: 'Virtual' },
    { icon: Code2, text: 'HackerRank' },
  ];

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
                  Upcoming Flagship Event
                </span>
              </div>
            </motion.div>

            {/* Headings */}
            <motion.div variants={itemVariants} className="space-y-4 max-w-2xl">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
                Master DSA in <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">7 Days</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Join India's growing student developer community for an intensive HackerRank coding challenge. Prepare for placements with daily contests and peer learning.
              </p>
            </motion.div>

            {/* Event Info Bar */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-6 bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 md:p-5 w-full max-w-3xl"
            >
              {eventDetails.map((detail, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-slate-300">
                  <div className="flex items-center justify-center bg-slate-800 border border-slate-700 rounded-lg h-9 w-9">
                    <detail.icon className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span className="text-sm font-semibold tracking-wide">{detail.text}</span>
                </div>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto">
              <Link href="/register" className="w-full sm:w-auto">
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="w-full sm:w-auto h-14 px-8 text-base font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 transition-all"
                >
                  Register Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/events/dsa-challenge" className="w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto h-14 px-8 text-base border-slate-700 hover:bg-slate-800/50 hover:text-white transition-all"
                >
                  View Event Details <ChevronRight className="ml-1 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Content - Visuals */}
          <motion.div 
            className="lg:col-span-5 relative w-full aspect-square max-w-[500px] mx-auto lg:mx-0 mt-10 lg:mt-0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {/* Hologram Box container */}
            <div className="absolute inset-0 bg-slate-900/30 rounded-3xl border border-slate-800 backdrop-blur-sm overflow-hidden flex items-center justify-center shadow-2xl">
              <AlgorithmGraph />

              {/* Floating floating code snippets */}
              <motion.div 
                className="absolute top-10 left-10 bg-slate-950/80 border border-slate-800 p-3 rounded-lg backdrop-blur-md shadow-lg"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <p className="text-[10px] font-mono text-emerald-400">dfs(node.left);</p>
              </motion.div>

              <motion.div 
                className="absolute bottom-20 right-8 bg-slate-950/80 border border-slate-800 p-3 rounded-lg backdrop-blur-md shadow-lg"
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <p className="text-[10px] font-mono text-teal-400">dp[i][j] = max(...)</p>
              </motion.div>
            </div>
            
            {/* Glowing borders */}
            <div className="absolute -inset-0.5 bg-gradient-to-tr from-emerald-500/20 to-teal-500/5 rounded-3xl z-[-1] blur-md" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
