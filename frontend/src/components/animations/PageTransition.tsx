'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useReducedMotion } from '@/utils/performance';

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = React.memo(function PageTransition({ children }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      key={pathname}
      initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
      animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
      exit={reducedMotion ? {} : { opacity: 0, y: 10 }}
      transition={reducedMotion ? {} : {
        duration: 0.4,
        ease: [0.21, 0.47, 0.32, 0.98] as const,
      }}
    >
      {children}
    </motion.div>
  );
});
