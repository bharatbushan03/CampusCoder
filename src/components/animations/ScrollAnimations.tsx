'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useInView } from 'framer-motion';

/**
 * Custom hook to detect if the user's browser or operating system
 * settings indicate a preference for reduced motion.
 */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mediaQuery.matches);

    const onChange = (event: MediaQueryListEvent) => {
      setReduced(event.matches);
    };

    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  duration?: number;
}

/**
 * Fades up/in a section on scroll when it enters the viewport.
 */
export const AnimatedSection: React.FC<AnimatedSectionProps> = React.memo(function AnimatedSection({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  duration = 0.5,
}) {
  const reducedMotion = usePrefersReducedMotion();

  const getOffset = () => {
    if (reducedMotion || direction === 'none') return { x: 0, y: 0 };
    switch (direction) {
      case 'up': return { x: 0, y: 30 };
      case 'down': return { x: 0, y: -30 };
      case 'left': return { x: 30, y: 0 };
      case 'right': return { x: -30, y: 0 };
    }
  };

  const offset = getOffset();

  const variants = {
    hidden: { 
      opacity: 0, 
      x: offset.x, 
      y: offset.y 
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: reducedMotion ? 0 : duration,
        delay: reducedMotion ? 0 : delay,
        ease: [0.21, 0.47, 0.32, 0.98] as const,
      }
    }
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Card container with optional hover effect and staggered entrance capability.
 */
export const AnimatedCard: React.FC<AnimatedCardProps> = React.memo(function AnimatedCard({
  children,
  className = '',
  delay = 0,
}) {
  const reducedMotion = usePrefersReducedMotion();

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 80,
        damping: 14,
        delay: reducedMotion ? 0 : delay,
      }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      whileHover={reducedMotion ? {} : { y: -6, transition: { duration: 0.2 } }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

interface MotionButtonProps {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

/**
 * Wrapper for buttons to add visual weight and micro-interactions on hover and click.
 */
export const MotionButton: React.FC<MotionButtonProps> = React.memo(function MotionButton({
  children,
  className = '',
  ...props
}) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <motion.div
      className={`inline-block ${className}`}
      whileHover={reducedMotion ? {} : { scale: 1.03 }}
      whileTap={reducedMotion ? {} : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 450, damping: 15 }}
      {...props}
    >
      {children}
    </motion.div>
  );
});

interface CounterStatProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * Incrementing stat number animation that counts from 0 to value when visible.
 */
export const CounterStat: React.FC<CounterStatProps> = React.memo(function CounterStat({
  value,
  duration = 2,
  prefix = '',
  suffix = '',
  className = '',
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { damping: 30, stiffness: 60 });
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (reducedMotion) {
      if (ref.current) {
        ref.current.textContent = `${prefix}${value}${suffix}`;
      }
      return;
    }

    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue, reducedMotion, prefix, suffix]);

  useEffect(() => {
    if (reducedMotion) return;
    
    return springValue.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${Math.floor(latest)}${suffix}`;
      }
    });
  }, [springValue, prefix, suffix, reducedMotion]);

  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  );
});
