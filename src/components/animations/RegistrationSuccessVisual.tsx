'use client';

import React, { useEffect, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Terminal, Code, Cpu, Sparkles } from 'lucide-react';
import { useReducedMotion } from '@/utils/performance';

interface FloatingParticle {
  id: number;
  char: string;
  x: number; // percentage offset
  y: number; // start offset
  delay: number;
  duration: number;
  scale: number;
}

const CHECKMARK_PATH_VARIANTS: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { type: 'spring', stiffness: 120, damping: 15, delay: 0.2 },
      opacity: { duration: 0.1, delay: 0.2 }
    }
  }
};

const BADGE_VARIANTS: Variants = {
  hidden: { scale: 0.6, rotateY: -180, opacity: 0 },
  visible: {
    scale: 1,
    rotateY: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 90,
      damping: 12,
      delay: 0.05
    }
  }
};

export const RegistrationSuccessVisual: React.FC = () => {
  const reducedMotion = useReducedMotion();
  const [particles, setParticles] = useState<FloatingParticle[]>([]);

  useEffect(() => {
    if (reducedMotion) return;

    // Generate some random floating particles representing code
    const symbols = ['</>', '{}', '[]', '01', '&&', '||', '++', 'CC'];
    const generated: FloatingParticle[] = Array.from({ length: 8 }).map((_, idx) => ({
      id: idx,
      char: symbols[idx % symbols.length],
      x: 15 + Math.random() * 70, // spread across 15% - 85% width
      y: 40 + Math.random() * 30, // vertical start offset
      delay: Math.random() * 1.5,
      duration: 3 + Math.random() * 2.5,
      scale: 0.7 + Math.random() * 0.5,
    }));

    setParticles(generated);
  }, [reducedMotion]);

  return (
    <div className="relative w-full h-[180px] flex items-center justify-center overflow-hidden rounded-2xl bg-slate-950/20 border border-slate-900/40 select-none mb-6">
      
      {/* 1. Pulsing Success Glow (disabled under reduced motion) */}
      {!reducedMotion && (
        <>
          <div className="absolute size-36 bg-emerald-500/5 rounded-full blur-2xl animate-pulse-slow"></div>
          <div className="absolute size-24 bg-emerald-500/10 rounded-full blur-xl animate-pulse"></div>
        </>
      )}

      {/* 2. Floating Code Particles */}
      {!reducedMotion && particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: p.y, x: `${p.x}%`, scale: p.scale }}
          animate={{
            opacity: [0, 0.7, 0.7, 0],
            y: [-20, -110],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
          className="absolute text-[9px] font-mono text-emerald-500/50 pointer-events-none"
        >
          {p.char}
        </motion.div>
      ))}

      {/* 3. Main Rotating 3D Success Badge */}
      <motion.div
        variants={reducedMotion ? {} : BADGE_VARIANTS}
        initial="hidden"
        animate="visible"
        style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
        className="relative size-24 bg-slate-900/90 border border-emerald-500/30 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.15)] group z-10"
      >
        {/* Animated Checkmark SVG inside */}
        <div className="relative flex items-center justify-center size-14">
          <svg className="size-full text-emerald-400" viewBox="0 0 52 52" fill="none">
            {/* Draw Circle */}
            <motion.circle
              cx="26"
              cy="26"
              r="23"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="150"
              initial={{ pathLength: 0, opacity: 0.2 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: reducedMotion ? 0 : 0.6, ease: 'easeOut' }}
            />
            {/* Draw Checkmark */}
            <motion.path
              d="M16 26l7 7 13-13"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              variants={CHECKMARK_PATH_VARIANTS}
            />
          </svg>
        </div>

        {/* Micro-decorations on corners */}
        <div className="absolute top-2 left-2 text-emerald-500/30"><Terminal className="size-3" /></div>
        <div className="absolute bottom-2 right-2 text-emerald-500/30"><Code className="size-3" /></div>
        <div className="absolute top-2 right-2 text-emerald-500/30"><Sparkles className="size-3 animate-pulse" /></div>
        <div className="absolute bottom-2 left-2 text-emerald-500/30"><Cpu className="size-3" /></div>
      </motion.div>
    </div>
  );
};

export default RegistrationSuccessVisual;
