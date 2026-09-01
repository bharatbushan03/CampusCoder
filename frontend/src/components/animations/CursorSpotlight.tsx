'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useReducedMotion } from '@/utils/performance';

export function CursorSpotlight() {
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const currentRef = useRef({ x: -1000, y: -1000 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);

    // Disable spotlight on touch-only devices
    if (window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      if (!visible) setVisible(true);
    };

    const handlePointerLeave = () => {
      setVisible(false);
    };

    const animate = () => {
      // Smooth linear interpolation (lerp) for soft fluid lighting movement
      const ease = 0.15;
      currentRef.current.x += (mouseRef.current.x - currentRef.current.x) * ease;
      currentRef.current.y += (mouseRef.current.y - currentRef.current.y) * ease;

      if (containerRef.current) {
        containerRef.current.style.setProperty('--spotlight-x', `${currentRef.current.x.toFixed(1)}px`);
        containerRef.current.style.setProperty('--spotlight-y', `${currentRef.current.y.toFixed(1)}px`);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('blur', handlePointerLeave);

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('blur', handlePointerLeave);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [visible]);

  if (!mounted || reducedMotion) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-700 ease-out ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={
        {
          '--spotlight-x': '-1000px',
          '--spotlight-y': '-1000px',
          background: `
            radial-gradient(
              700px circle at var(--spotlight-x) var(--spotlight-y),
              rgba(16, 185, 129, 0.08),
              rgba(56, 189, 248, 0.04) 35%,
              rgba(255, 255, 255, 0.02) 55%,
              transparent 75%
            ),
            radial-gradient(
              350px circle at var(--spotlight-x) var(--spotlight-y),
              rgba(255, 255, 255, 0.05),
              transparent 70%
            )
          `,
        } as React.CSSProperties
      }
    />
  );
}

export default CursorSpotlight;
