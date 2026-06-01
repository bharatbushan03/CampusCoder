'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, Code2, Cpu } from 'lucide-react';

interface CampusCoderLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullPage?: boolean;
  text?: string;
}

export const CampusCoderLoader: React.FC<CampusCoderLoaderProps> = ({
  size = 'md',
  fullPage = false,
  text,
}) => {
  const sizeClasses = {
    sm: 'size-12',
    md: 'size-20',
    lg: 'size-32',
    xl: 'size-48',
  };

  const iconSizeClasses = {
    sm: 'size-4',
    md: 'size-6',
    lg: 'size-10',
    xl: 'size-14',
  };

  const container = (
    <div className="relative flex flex-col items-center justify-center">
      {/* Outer Rotating Ring */}
      <motion.div
        className={`${sizeClasses[size]} rounded-full border-2 border-emerald-500/10 border-t-emerald-500`}
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: "linear"
        }}
      />

      {/* Inner Monogram */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="font-mono font-bold text-white flex items-baseline gap-px select-none"
          style={{ 
            fontSize: size === 'sm' ? '12px' : size === 'md' ? '20px' : size === 'lg' ? '32px' : '48px' 
          }}
        >
          <span>C</span>
          <span className="text-emerald-500">C</span>
        </motion.div>
      </div>

      {/* Orbiting Symbols */}
      {size !== 'sm' && (
        <>
          <motion.div
            className="absolute text-emerald-400/40"
            animate={{
              rotate: 360,
              x: [0, 40, 0, -40, 0],
              y: [40, 0, -40, 0, 40],
            }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          >
            <Code2 size={size === 'md' ? 12 : 20} />
          </motion.div>
          <motion.div
            className="absolute text-emerald-400/40"
            animate={{
              rotate: -360,
              x: [0, -45, 0, 45, 0],
              y: [-45, 0, 45, 0, -45],
            }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          >
            <Terminal size={size === 'md' ? 10 : 16} />
          </motion.div>
          <motion.div
            className="absolute text-emerald-400/40"
            animate={{
              rotate: 360,
              x: [35, 0, -35, 0, 35],
              y: [0, 35, 0, -35, 0],
            }}
            transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
          >
            <Cpu size={size === 'md' ? 10 : 16} />
          </motion.div>
        </>
      )}

      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-emerald-500/60"
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
        {container}
      </div>
    );
  }

  return container;
};
