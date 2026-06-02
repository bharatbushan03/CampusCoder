'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

interface AnimatedEventCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

const SPRING_CONFIG = { damping: 25, stiffness: 200, mass: 0.5 };

export const AnimatedEventCard: React.FC<AnimatedEventCardProps> = React.memo(function AnimatedEventCard({
  children,
  className = '',
  delay = 0,
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isTouch, setIsTouch] = useState(false);

  // Detect if the user is on a touch device
  useEffect(() => {
    const detectTouch = () => {
      setIsTouch(window.matchMedia('(pointer: coarse)').matches);
    };
    requestAnimationFrame(detectTouch);
  }, []);

  // Framer Motion values for 3D tilt
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  // Map coordinates [0, 1] to rotate angles [-10, 10] degrees
  const rotateX = useTransform(y, [0, 1], [8, -8]);
  const rotateY = useTransform(x, [0, 1], [-8, 8]);

  // Spring animations for rotation to make them super smooth
  const rotateXSpring = useSpring(rotateX, SPRING_CONFIG);
  const rotateYSpring = useSpring(rotateY, SPRING_CONFIG);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouch || !cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Relative coordinates between 0 and 1
    const mouseX = (e.clientX - rect.left) / width;
    const mouseY = (e.clientY - rect.top) / height;

    x.set(mouseX);
    y.set(mouseY);

    // Update CSS custom properties for radial shine tracker
    const shineX = mouseX * 100;
    const shineY = mouseY * 100;
    cardRef.current.style.setProperty('--shine-x', `${shineX}%`);
    cardRef.current.style.setProperty('--shine-y', `${shineY}%`);
  };

  const handleMouseLeave = () => {
    // Reset values to center the card
    x.set(0.5);
    y.set(0.5);
  };

  // Entrance variants
  const cardVariants = {
    hidden: { opacity: 0, y: 35 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 80,
        damping: 12,
        delay: delay,
      },
    },
  };

  return (
    <motion.div
      ref={cardRef}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: isTouch ? 0 : rotateXSpring,
        rotateY: isTouch ? 0 : rotateYSpring,
        transformStyle: 'preserve-3d',
      }}
      className={`group relative rounded-2xl border bg-slate-950 border-slate-900 overflow-hidden transition-all duration-300 hover:border-emerald-500/40 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.2)] ${className}`}
    >
      {/* Radial Shine Overlay */}
      {!isTouch && (
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"
          style={{
            background: 'radial-gradient(circle 200px at var(--shine-x, 50%) var(--shine-y, 50%), rgba(16, 185, 129, 0.1), transparent)',
          }}
        />
      )}
      
      {/* Card Content wrapper to support 3D depth */}
      <div style={{ transform: 'translateZ(10px)' }} className="h-full flex flex-col relative z-20">
        {children}
      </div>
    </motion.div>
  );
});

export default AnimatedEventCard;
