'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CountdownTimerProps {
  targetDate: Date;
  className?: string;
}

export function CountdownTimer({ targetDate, className = '' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    hasStarted: false,
    isMounted: false,
  });

  useEffect(() => {
    // Prevent hydration mismatch by only rendering real time after mount
    setTimeLeft(prev => ({ ...prev, isMounted: true }));

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate.getTime() - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
          hasStarted: false,
          isMounted: true,
        });
      } else {
        setTimeLeft(prev => ({
          ...prev,
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          hasStarted: true,
          isMounted: true,
        }));
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  // Don't render until mounted to avoid hydration errors on server-rendered pages
  if (!timeLeft.isMounted) {
    return <div className={`h-24 ${className}`} aria-hidden="true" />;
  }

  if (timeLeft.hasStarted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center justify-center p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl ${className}`}
        role="status"
        aria-live="polite"
      >
        <span className="text-2xl md:text-3xl font-extrabold text-emerald-400 font-mono flex items-center gap-3">
          <span role="img" aria-label="rocket">🚀</span> Event Started
        </span>
      </motion.div>
    );
  }

  const timeUnits = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Mins', value: timeLeft.minutes },
    { label: 'Secs', value: timeLeft.seconds },
  ];

  return (
    <div 
      className={`flex gap-3 md:gap-4 ${className}`} 
      role="timer" 
      aria-label="Countdown until event starts"
      aria-live="off" // "off" for fast-updating timers to not spam screen readers
    >
      {timeUnits.map((unit) => (
        <div 
          key={unit.label} 
          className="flex flex-col items-center justify-center bg-slate-950 border border-slate-800/80 rounded-xl w-16 h-16 md:w-20 md:h-20 shadow-inner overflow-hidden relative"
        >
          {/* Animated Number Flip */}
          <AnimatePresence mode="popLayout">
            <motion.span
              key={`${unit.label}-${unit.value}`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-2xl md:text-3xl font-extrabold text-emerald-400 font-mono tabular-nums leading-none"
            >
              {unit.value.toString().padStart(2, '0')}
            </motion.span>
          </AnimatePresence>
          <span className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-mono font-bold">
            {unit.label}
          </span>
          
          {/* Screen reader only text for each unit */}
          <span className="sr-only">{unit.value} {unit.label}</span>
        </div>
      ))}
    </div>
  );
}
